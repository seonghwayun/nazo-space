#!/usr/bin/env node
/**
 * Import nazos from the "나조 마켓 구매 목록" xlsx, using the nazo.life nazoma
 * catalog (https://nazo.life/nazoma/) for maker names and images.
 *
 * For every sheet row whose title exactly matches a catalog item
 * (ignoring width/case/whitespace) and is not already in the DB:
 *   1. resolve creators (scripts/nazoma-mapping.json, then split on &/＆/+/＋;
 *      existing creators are linked by name, missing ones are created)
 *   2. download the image, resize (max 1600px) + convert to WebP, upload to R2
 *   3. insert the nazo (originalTitle, creators, imageUrl, estimatedTime = column M)
 * nazoma-mapping.json: "titles" maps sheet typos to catalog titles, "manual"
 * imports sheet-only titles (maker = column C, no image), "exclude" skips titles
 * (bundle sets), "expand" imports the works inside a set instead of the set.
 * Other unmatched rows are only printed, never imported.
 * Re-running is safe: titles already in the DB are skipped.
 *
 * Usage:
 *   pnpm import:nazoma "<path to xlsx>"            # dry run
 *   pnpm import:nazoma "<path to xlsx>" --list     # dry run + every nazo to import
 *   pnpm import:nazoma "<path to xlsx>" --apply    # actually import
 *
 * Required env: MONGODB_URI (+ R2_* for --apply)
 */
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { parseSheet, planImport, splitMakers, resolveCreators, normalizeName } from "../lib/nazoma-import.ts";

const NAZOMA_BASE = "https://nazo.life/nazoma/";
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_DELAY_MS = 300;

const APPLY = process.argv.includes("--apply");
const xlsxPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!xlsxPath) {
  console.error('Usage: pnpm import:nazoma "<path to xlsx>" [--apply]');
  process.exit(1);
}

const required = ["MONGODB_URI", ...(APPLY ? ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"] : [])];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

/** Read named entries from a zip (xlsx) using the central directory. */
function readZipEntries(buf, names) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip/xlsx file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip central directory");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (names.includes(name)) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      out[name] = (method === 0 ? data : inflateRawSync(data)).toString("utf8");
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function readSheetRows(path) {
  const files = readZipEntries(readFileSync(path), ["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"]);
  if (!files["xl/worksheets/sheet1.xml"]) throw new Error("sheet1 not found in xlsx");
  return parseSheet(files["xl/sharedStrings.xml"] || "", files["xl/worksheets/sheet1.xml"]).slice(1); // drop header
}

async function fetchCatalog() {
  const res = await fetch(`${NAZOMA_BASE}api.php?action=list`);
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.items)) throw new Error("unexpected catalog format");
  return data.items.map((it) => ({ title: String(it.title || ""), maker: String(it.maker || ""), imageUrl: String(it.imageUrl || "") }));
}

async function downloadImage(relative) {
  // Catalog data is untrusted: only accept plain files under uploads/.
  if (!/^uploads\/[\w.-]+$/.test(relative)) throw new Error(`unexpected image path: ${relative}`);
  const res = await fetch(new URL(relative, NAZOMA_BASE));
  if (!res.ok) throw new Error(`image ${res.status}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!type.startsWith("image/")) throw new Error(`not an image: ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error(`image too large: ${buf.length}`);
  return sharp(buf)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const mapping = JSON.parse(readFileSync(new URL("./nazoma-mapping.json", import.meta.url), "utf8"));
  const overrides = mapping.creators || {};
  const options = { titleAliases: mapping.titles || {}, manualTitles: mapping.manual || [], excludeTitles: mapping.exclude || [], expand: mapping.expand || {} };

  const rows = readSheetRows(xlsxPath);
  const items = await fetchCatalog();

  await mongoose.connect(process.env.MONGODB_URI, { dbName: "nazo-space" });
  const db = mongoose.connection.db;
  const nazos = db.collection("nazos");
  const creatorsCol = db.collection("creators");

  const existingTitles = (await nazos.find({}, { projection: { originalTitle: 1 } }).toArray()).map((d) => d.originalTitle);
  const existingCreators = (await creatorsCol.find({}, { projection: { name: 1 } }).toArray()).map((c) => ({ id: String(c._id), name: c.name }));

  const plan = planImport(rows, items, existingTitles, options);
  const perNazo = plan.toImport.map((c) => ({ ...c, creators: resolveCreators(splitMakers(c.maker, overrides), existingCreators) }));

  // Summaries
  const linked = new Map();
  const created = new Map();
  for (const n of perNazo) {
    for (const c of n.creators) {
      const bucket = c.existingId ? linked : created;
      const key = normalizeName(c.name);
      const e = bucket.get(key) || { name: c.name, count: 0, from: new Set() };
      e.count++;
      e.from.add(n.maker);
      bucket.set(key, e);
    }
  }
  const show = (m) =>
    [...m.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map((e) => {
        const from = [...e.from].filter((f) => f !== e.name);
        return `  ${String(e.count).padStart(3)}  ${e.name}${from.length ? `   ← ${from.join(" | ")}` : ""}`;
      })
      .join("\n");

  console.log(`${APPLY ? "APPLY" : "DRY RUN"}: ${rows.filter((r) => r.B).length} sheet rows, ${items.length} catalog items\n`);
  console.log(`Already in DB (skipped): ${plan.alreadyInDb.length}`);
  plan.alreadyInDb.forEach((t) => console.log(`  - ${t}`));
  console.log(`\nExcluded by mapping (sets etc.): ${plan.excluded.length}`);
  plan.excluded.forEach((t) => console.log(`  - ${t}`));
  console.log(`\nNot found in catalog (NOT imported, check manually): ${plan.unmatched.length}`);
  plan.unmatched.forEach((u) => console.log(`  - ${u.title}  [${u.seller || "?"}]   closest: ${u.closest || "-"}`));
  console.log(`\nExisting creators linked: ${linked.size}\n${show(linked)}`);
  console.log(`\nNew creators to create: ${created.size}\n${show(created)}`);
  const noImage = perNazo.filter((n) => !n.imageUrl);
  console.log(`\nWithout image (imported without imageUrl): ${noImage.length}`);
  noImage.forEach((n) => console.log(`  - ${n.title}`));
  if (process.argv.includes("--list")) {
    console.log("\nAll nazos to import:");
    perNazo.forEach((n) => console.log(`  - ${n.title}  [${n.creators.map((c) => c.name).join(", ")}]${n.imageUrl ? "" : "  (no image)"}`));
  }
  console.log(`\nNazos to import: ${perNazo.length} (with estimatedTime: ${perNazo.filter((n) => n.estimatedTime).length})`);

  if (!APPLY) {
    console.log("\n(dry run — nothing written; re-run with --apply)");
    await mongoose.disconnect();
    return;
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  const publicBase = process.env.R2_PUBLIC_URL.replace(/\/+$/, "");

  const creatorIds = new Map(existingCreators.map((c) => [normalizeName(c.name), new mongoose.Types.ObjectId(c.id)]));
  async function creatorId(name) {
    const key = normalizeName(name);
    if (!creatorIds.has(key)) {
      const now = new Date();
      const { insertedId } = await creatorsCol.insertOne({ name, createdAt: now, updatedAt: now, __v: 0 });
      creatorIds.set(key, insertedId);
      console.log(`  + creator ${name}`);
    }
    return creatorIds.get(key);
  }

  let ok = 0;
  let failed = 0;
  for (const n of perNazo) {
    try {
      let imageUrl;
      if (n.imageUrl) {
        const body = await downloadImage(n.imageUrl);
        const key = `nazo/${randomUUID()}.webp`;
        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }));
        imageUrl = `${publicBase}/${key}`;
        await sleep(DOWNLOAD_DELAY_MS);
      }
      const ids = [];
      for (const c of n.creators) ids.push(await creatorId(c.name));
      const now = new Date();
      await nazos.insertOne({
        originalTitle: n.title,
        creators: ids,
        tags: [],
        ...(imageUrl && { imageUrl }),
        ...(n.estimatedTime && { estimatedTime: n.estimatedTime }),
        averageRate: 0,
        rateCount: 0,
        totalRate: 0,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      });
      ok++;
      console.log(`✓ ${n.title}  [${n.creators.map((c) => c.name).join(", ")}]`);
    } catch (err) {
      failed++;
      console.error(`✗ ${n.title}\n    ${err.message}`);
    }
  }

  console.log(`\nDone: ${ok} imported, ${failed} failed.${failed ? " Re-run to retry the failed ones." : ""}`);
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
