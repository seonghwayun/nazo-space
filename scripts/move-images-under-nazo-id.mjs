#!/usr/bin/env node
/**
 * Put every nazo image in R2 under a key that names its nazo:
 *   nazo/<nazoId>.<ext>
 * and store its URL with `?v=<time>` (images are served as immutable, so a
 * changed version is what gets a replaced image past caches).
 *
 * Two kinds of nazos are fixed:
 *   - "move":   imageUrl is in our bucket but not at the nazo's key
 *               (old nazo/<uuid>.<ext> keys). The object is copied to
 *               nazo/<nazoId>.<same ext>; content type and cache headers are
 *               copied as they are.
 *   - "import": imageUrl points at another site. The image is downloaded,
 *               resized (longest side ≤ 1600px) and converted to WebP (GIFs are
 *               kept as they are, to keep animation), then uploaded to
 *               nazo/<nazoId>.<ext>.
 * In both cases imageUrl in MongoDB is then updated.
 *
 * Old R2 objects are NOT deleted. Several nazos can share one image (e.g. works
 * imported from a bundle set), so each one gets its own copy and the old key
 * may still be in use until every nazo has moved. Once the app shows the moved
 * images correctly, remove the leftovers with --delete-orphans: it lists every
 * object under nazo/ in the bucket and deletes those no nazo's imageUrl points
 * at (skipping objects younger than a day, which may belong to an upload whose
 * nazo is still being saved). It moves nothing.
 *
 * Usage:
 *   pnpm move:images                            # dry run (reads MongoDB only)
 *   pnpm move:images --apply                    # copy / download + upload, then update imageUrl
 *   pnpm move:images --delete-orphans           # list unreferenced objects under nazo/
 *   pnpm move:images --delete-orphans --apply   # delete them
 *
 * Required env: MONGODB_URI, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *               R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */
import mongoose from "mongoose";
import sharp from "sharp";
import {
  S3Client,
  CopyObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");
const DELETE_ORPHANS = process.argv.includes("--delete-orphans");
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;
const OWN_KEY = /^nazo\/([0-9a-f]{24})\.[a-z0-9]+$/i;
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 30_000;
const CONCURRENCY = 10;

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

/** R2 key of a public image URL (without ?v=…), or null when the URL is not in our bucket. */
function keyOf(url) {
  if (typeof url !== "string" || !url.startsWith(`${publicBase}/`)) return null;
  return decodeURIComponent(url.slice(publicBase.length + 1).split(/[?#]/)[0]);
}

const versioned = (key) => `${publicBase}/${key}?v=${Date.now().toString(36)}`;

function isHttpUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function plan(nazo) {
  const id = String(nazo._id);
  const url = nazo.imageUrl;
  if (!url) return null;

  const key = keyOf(url);
  if (key) {
    const own = OWN_KEY.exec(key);
    if (own && own[1].toLowerCase() === id) return null;
    const ext = (/\.([a-z0-9]+)$/i.exec(key)?.[1] ?? "webp").toLowerCase();
    return { kind: "move", id, title: nazo.originalTitle, url, oldKey: key, newKey: `nazo/${id}.${ext}` };
  }
  if (isHttpUrl(url)) return { kind: "import", id, title: nazo.originalTitle, url };
  return { kind: "skip", id, title: nazo.originalTitle, url };
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS), redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status} ${res.statusText}`);
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > MAX_DOWNLOAD_BYTES) throw new Error(`too large (${declared} bytes)`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
  return buffer;
}

/** Resize + WebP, or keep a GIF as it is. Throws when the data isn't an image sharp can read. */
async function convert(buffer) {
  const { format } = await sharp(buffer).metadata();
  if (format === "gif") return { body: buffer, contentType: "image/gif", ext: "gif" };
  const webp = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { body: webp, contentType: "image/webp", ext: "webp" };
}

async function applyMove(m) {
  await r2.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${m.oldKey.split("/").map(encodeURIComponent).join("/")}`,
      Key: m.newKey,
      MetadataDirective: "COPY",
    })
  );
  return versioned(m.newKey);
}

async function applyImport(m) {
  const original = await download(m.url);
  const { body, contentType, ext } = await convert(original);
  const key = `nazo/${m.id}.${ext}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  logAbove(console.log, `  imported ${m.title}: ${(original.length / 1024).toFixed(0)}KB → ${(body.length / 1024).toFixed(0)}KB ${ext}`);
  return versioned(key);
}

async function listImageObjects() {
  const objects = [];
  let ContinuationToken;
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "nazo/", ContinuationToken }));
    for (const o of page.Contents ?? []) objects.push({ key: o.Key, lastModified: o.LastModified, size: o.Size ?? 0 });
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}

async function deleteOrphans(nazos) {
  const docs = await nazos.find({}, { projection: { imageUrl: 1 } }).toArray();
  const referenced = new Set(docs.map((n) => keyOf(n.imageUrl)).filter(Boolean));
  // Guard: an empty or wrong database would make every image look unreferenced.
  if (docs.length === 0 || referenced.size === 0) {
    throw new Error(`Refusing to delete: found ${docs.length} nazos and ${referenced.size} R2 image references. Check MONGODB_URI / R2_PUBLIC_URL.`);
  }

  const objects = await listImageObjects();
  const cutoff = Date.now() - ORPHAN_MIN_AGE_MS;
  const unreferenced = objects.filter((o) => !referenced.has(o.key));
  const orphans = unreferenced.filter((o) => o.lastModified && o.lastModified.getTime() < cutoff);
  const recent = unreferenced.length - orphans.length;
  const totalKB = orphans.reduce((a, o) => a + o.size, 0) / 1024;

  console.log(
    `${objects.length} objects under nazo/ · ${referenced.size} referenced by nazos · ` +
      `${orphans.length} unreferenced (${totalKB.toFixed(0)}KB)` +
      (recent ? ` · ${recent} unreferenced but younger than a day (kept)` : "")
  );
  for (const o of orphans.slice(0, 10)) console.log(`  ${o.key}`);
  if (orphans.length > 10) console.log(`  … and ${orphans.length - 10} more`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --delete-orphans --apply to delete them.");
    return 0;
  }

  let deleted = 0;
  let failed = 0;
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);
    const res = await r2.send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch.map((o) => ({ Key: o.key })), Quiet: true } })
    );
    for (const e of res.Errors ?? []) console.error(`  failed: ${e.Key}: ${e.Message}`);
    failed += res.Errors?.length ?? 0;
    deleted += batch.length - (res.Errors?.length ?? 0);
  }
  console.log(`\nDeleted ${deleted}, failed ${failed}.`);
  return failed;
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: "nazo-space" });
const nazos = mongoose.connection.collection("nazos");

if (DELETE_ORPHANS) {
  let failed = 1;
  try {
    failed = await deleteOrphans(nazos);
  } catch (error) {
    console.error(error.message);
  }
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

const all = await nazos.find({}, { projection: { originalTitle: 1, imageUrl: 1 } }).toArray();
const plans = all.map(plan).filter(Boolean);
const moves = plans.filter((p) => p.kind === "move");
const imports = plans.filter((p) => p.kind === "import");
const skips = plans.filter((p) => p.kind === "skip");

console.log(
  `${all.length} nazos · ${moves.length} to move inside R2 · ${imports.length} to download from other sites · ` +
    `${all.length - plans.length} already fine or no image` +
    (skips.length ? ` · ${skips.length} with an unusable imageUrl (left as is)` : "")
);
for (const m of moves.slice(0, 5)) console.log(`  move   ${m.oldKey} → ${m.newKey}  (${m.title})`);
if (moves.length > 5) console.log(`  … and ${moves.length - 5} more moves`);
for (const m of imports) console.log(`  import ${m.url}  (${m.title})`);
for (const m of skips) console.log(`  skip   ${m.url}  (${m.title})`);

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to copy / download, upload and update imageUrl.");
  await mongoose.disconnect();
  process.exit(0);
}

const queue = [...moves, ...imports];
const total = queue.length;
let done = 0;
let failed = 0;
const startedAt = Date.now();

function progress() {
  const line = `  ${done + failed}/${total} (failed ${failed}) · ${((Date.now() - startedAt) / 1000).toFixed(0)}s`;
  if (process.stdout.isTTY) process.stdout.write(`\r${line}`);
  else if ((done + failed) % 50 === 0 || done + failed === total) console.log(line);
}

/** Log a line without breaking the \r progress line. */
function logAbove(write, text) {
  if (process.stdout.isTTY) process.stdout.write("\r\x1b[K");
  write(text);
  progress();
}

async function worker() {
  for (let m = queue.shift(); m; m = queue.shift()) {
    try {
      const newUrl = m.kind === "move" ? await applyMove(m) : await applyImport(m);
      // Only if nobody changed the image in the meantime.
      await nazos.updateOne({ _id: new mongoose.Types.ObjectId(m.id), imageUrl: m.url }, { $set: { imageUrl: newUrl } });
      done++;
      progress();
    } catch (error) {
      failed++;
      logAbove(console.error, `  failed (${m.kind}): ${m.url} (${m.title}): ${error.message}`);
    }
  }
}

console.log(`\nProcessing ${total} nazos, ${CONCURRENCY} at a time…`);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
if (process.stdout.isTTY) process.stdout.write("\n");
console.log(`Done ${done}, failed ${failed} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);

// Old keys that no nazo points at any more.
const stillUsed = new Set(
  (await nazos.find({}, { projection: { imageUrl: 1 } }).toArray()).map((n) => keyOf(n.imageUrl)).filter(Boolean)
);
const orphans = [...new Set(moves.map((m) => m.oldKey))].filter((k) => !stillUsed.has(k));
console.log(`${orphans.length} old objects are no longer referenced. Check the app, then remove them with --delete-orphans:`);
for (const k of orphans.slice(0, 10)) console.log(`  ${k}`);
if (orphans.length > 10) console.log(`  … and ${orphans.length - 10} more`);

await mongoose.disconnect();
process.exit(failed ? 1 : 0);
