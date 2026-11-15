#!/usr/bin/env node
/**
 * Add Mystery for You (MFY) nazos from a CSV and a folder of covers.
 *
 *   mfy-csv.csv   제목,연,월,타입 (타입: 설/월/화)
 *   MFY/YYMMT.*   one cover per row: YY year, MM month, T type (1 설, 2 월, 3 화)
 *
 * For each row this creates a nazo with
 *   - originalTitle = 제목
 *   - one tag by type: 설 → "Mystery for You 雪の謎", 월 → "… 月の謎", 화 → "… 花の謎"
 *   - creator SCRAP
 *   - the cover resized (longest side ≤ 1600px), converted to WebP and uploaded
 *     to R2 at nazo/<nazoId>.webp
 * createdAt follows the release order (oldest first), so the newest release is
 * the most recent in "최근 등록".
 *
 * A row whose title already exists as a nazo is not added again; that nazo only
 * gets the row's type tag if it lacks it (so re-running is safe).
 * Skipped and reported: rows without a cover and covers without a row.
 *
 * Usage:
 *   pnpm import:mfy                              # dry run: shows what would be added
 *   pnpm import:mfy --apply                      # upload covers, create nazos
 *   pnpm import:mfy --csv other.csv --dir Other  # other inputs
 *
 * Required env: MONGODB_URI, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *               R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MFY_TYPES, compareMfyRows, mfyImageKey, parseMfyCsv } from "../lib/mfy-import.ts";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const argValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const CSV_PATH = path.resolve(argValue("--csv", "mfy-csv.csv"));
const IMAGE_DIR = path.resolve(argValue("--dir", "MFY"));
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;
const CONCURRENCY = 5;

const required = ["MONGODB_URI", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const bucket = process.env.R2_BUCKET;
const publicBase = process.env.R2_PUBLIC_URL.replace(/\/+$/, "");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── Inputs ──────────────────────────────────────────────────────────────────
const { rows, errors } = parseMfyCsv(await readFile(CSV_PATH, "utf8"));
if (errors.length) {
  console.error(`${CSV_PATH} has problems; fix them first:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const imageByKey = new Map();
for (const file of await readdir(IMAGE_DIR)) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) continue;
  const key = path.basename(file, path.extname(file));
  if (imageByKey.has(key)) {
    console.error(`Two covers for ${key}: ${imageByKey.get(key)} and ${file}. Keep one.`);
    process.exit(1);
  }
  imageByKey.set(key, file);
}

const seenKeys = new Map();
for (const row of rows) {
  const key = mfyImageKey(row);
  if (seenKeys.has(key)) {
    console.error(`Lines ${seenKeys.get(key)} and ${row.line} both map to ${key} (same year, month and type).`);
    process.exit(1);
  }
  seenKeys.set(key, row.line);
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: "nazo-space" });
const db = mongoose.connection.db;
const nazos = db.collection("nazos");

const tagNames = Object.values(MFY_TYPES).map((t) => t.tag);
const tags = await db.collection("tags").find({ name: { $in: tagNames } }).toArray();
const tagIdByName = new Map(tags.map((t) => [t.name, t._id]));
const missingTags = tagNames.filter((n) => !tagIdByName.has(n));
if (missingTags.length) {
  console.error(`Missing tags in the database: ${missingTags.join(", ")}`);
  await mongoose.disconnect();
  process.exit(1);
}

const CREATOR_NAME = "SCRAP";
const creators = await db.collection("creators").find({ name: CREATOR_NAME }).toArray();
if (creators.length !== 1) {
  console.error(`Expected one creator named ${CREATOR_NAME}, found ${creators.length}.`);
  await mongoose.disconnect();
  process.exit(1);
}
const creatorId = creators[0]._id;

const existingTitles = new Set(
  (await nazos.find({ originalTitle: { $in: rows.map((r) => r.title) } }, { projection: { originalTitle: 1 } }).toArray()).map(
    (n) => n.originalTitle
  )
);

// ── Plan ────────────────────────────────────────────────────────────────────
const plan = [];
const noCover = [];
const alreadyThere = [];
for (const row of [...rows].sort(compareMfyRows)) {
  const key = mfyImageKey(row);
  if (existingTitles.has(row.title)) alreadyThere.push(row);
  else if (!imageByKey.has(key)) noCover.push(row);
  else plan.push({ row, key, file: imageByKey.get(key) });
}
const rowKeys = new Set(rows.map(mfyImageKey));
const unusedCovers = [...imageByKey.entries()].filter(([key]) => !rowKeys.has(key)).map(([, file]) => file);

// Every cover must be an image sharp can read, before anything is uploaded.
const unreadable = [];
for (const p of plan) {
  try {
    const { width, height } = await sharp(path.join(IMAGE_DIR, p.file)).metadata();
    if (!width || !height) throw new Error("no size");
  } catch (error) {
    unreadable.push(`${p.file}: ${error.message}`);
  }
}
if (unreadable.length) {
  console.error(`Unreadable covers; fix or replace them first:`);
  for (const u of unreadable) console.error(`  ${u}`);
  await mongoose.disconnect();
  process.exit(1);
}

const label = (r) => `${r.year}.${String(r.month).padStart(2, "0")} ${r.type} ${r.title}`;
console.log(`CSV rows: ${rows.length} · covers: ${imageByKey.size}`);
console.log(`To add: ${plan.length}`);
console.log(`Creator: ${CREATOR_NAME}`);
for (const p of plan.slice(0, 12)) console.log(`  ${p.file.padEnd(11)} → ${label(p.row)}  [${MFY_TYPES[p.row.type].tag}]`);
if (plan.length > 12) console.log(`  … and ${plan.length - 12} more`);
if (alreadyThere.length) {
  console.log(`Already a nazo with this title: only its type tag is added if missing (${alreadyThere.length}):`);
  for (const r of alreadyThere) console.log(`  ${label(r)}  [+${MFY_TYPES[r.type].tag}]`);
}
if (noCover.length) {
  console.log(`Skipped, no cover in ${path.basename(IMAGE_DIR)}/ (${noCover.length}):`);
  for (const r of noCover) console.log(`  ${mfyImageKey(r)} ${label(r)}`);
}
if (unusedCovers.length) console.log(`Covers with no CSV row, not used (${unusedCovers.length}): ${unusedCovers.join(", ")}`);

if (!APPLY) {
  console.log("\nDry run: nothing was uploaded or created. Re-run with --apply to add them.");
  await mongoose.disconnect();
  process.exit(0);
}

// ── Apply ───────────────────────────────────────────────────────────────────
for (const row of alreadyThere) {
  const tagId = tagIdByName.get(MFY_TYPES[row.type].tag);
  const res = await nazos.updateMany(
    { originalTitle: row.title, tags: { $ne: tagId } },
    { $addToSet: { tags: tagId }, $set: { updatedAt: new Date() } }
  );
  console.log(`Tagged existing "${row.title}" with ${MFY_TYPES[row.type].tag}: ${res.modifiedCount} updated`);
}

// Oldest release gets the earliest createdAt; one second apart keeps the order stable.
const baseTime = Date.now() - plan.length * 1000;
plan.forEach((p, i) => (p.createdAt = new Date(baseTime + i * 1000)));

let done = 0;
let failed = 0;
const startedAt = Date.now();
const total = plan.length;

function progress() {
  const line = `  ${done + failed}/${total} (failed ${failed}) · ${((Date.now() - startedAt) / 1000).toFixed(0)}s`;
  if (process.stdout.isTTY) process.stdout.write(`\r${line}`);
  else if ((done + failed) % 20 === 0 || done + failed === total) console.log(line);
}

function logAbove(write, text) {
  if (process.stdout.isTTY) process.stdout.write("\r\x1b[K");
  write(text);
  progress();
}

async function addOne(p) {
  const id = new mongoose.Types.ObjectId();
  const original = await readFile(path.join(IMAGE_DIR, p.file));
  const webp = await sharp(original)
    .rotate() // respect EXIF orientation
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const key = `nazo/${id.toHexString()}.webp`;
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: webp,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  // Same shape as a nazo saved from the admin form.
  await nazos.insertOne({
    _id: id,
    originalTitle: p.row.title,
    description: "",
    translatedTitle: "",
    creators: [creatorId],
    tags: [tagIdByName.get(MFY_TYPES[p.row.type].tag)],
    imageUrl: `${publicBase}/${key}?v=${Date.now().toString(36)}`,
    difficulty: "",
    estimatedTime: "",
    averageRate: 0,
    rateCount: 0,
    totalRate: 0,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
    __v: 0,
  });
}

const queue = [...plan];
async function worker() {
  for (let p = queue.shift(); p; p = queue.shift()) {
    try {
      await addOne(p);
      done++;
      progress();
    } catch (error) {
      failed++;
      logAbove(console.error, `  failed: ${p.file} (${label(p.row)}): ${error.message}`);
    }
  }
}

console.log(`\nAdding ${total} nazos, ${CONCURRENCY} at a time…`);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
if (process.stdout.isTTY) process.stdout.write("\n");
console.log(`Done ${done}, failed ${failed} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);
if (failed) console.log("Re-run to retry the failed ones: rows already added are skipped by title.");

await mongoose.disconnect();
process.exit(failed ? 1 : 0);
