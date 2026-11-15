#!/usr/bin/env node
/**
 * Migrate Nazo images from Vercel Blob to Cloudflare R2.
 *
 * For every nazo whose imageUrl points at *.blob.vercel-storage.com:
 *   1. download the image
 *   2. resize (max 1600px) + convert to WebP with sharp (GIFs kept as-is)
 *   3. upload to R2 under nazo/<uuid>.<ext>
 *   4. update imageUrl in MongoDB
 *
 * Old blobs are NOT deleted, so the migration can be verified first.
 *
 * Usage:
 *   pnpm migrate:images            # dry run
 *   pnpm migrate:images --apply    # actually migrate
 *
 * Required env: MONGODB_URI, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *               R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;
const BLOB_HOST_PATTERN = /\.blob\.vercel-storage\.com$/;

const required = [
  "MONGODB_URI",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const publicBase = process.env.R2_PUBLIC_URL.replace(/\/+$/, "");

function isBlobUrl(url) {
  try {
    return BLOB_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

async function convert(buffer, contentType) {
  if (contentType === "image/gif") {
    return { body: buffer, contentType, ext: "gif" };
  }
  const webp = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { body: webp, contentType: "image/webp", ext: "webp" };
}

const fmt = (n) => `${(n / 1024).toFixed(0)}KB`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "nazo-space" });
  const nazos = mongoose.connection.db.collection("nazos");

  const docs = await nazos
    .find({ imageUrl: { $regex: "blob\\.vercel-storage\\.com" } }, { projection: { imageUrl: 1, originalTitle: 1 } })
    .toArray();
  const targets = docs.filter((d) => isBlobUrl(d.imageUrl));

  console.log(`${APPLY ? "APPLY" : "DRY RUN"}: ${targets.length} nazo(s) with Vercel Blob images\n`);

  let ok = 0;
  let failed = 0;
  let before = 0;
  let after = 0;

  for (const doc of targets) {
    const label = `[${doc._id}] ${doc.originalTitle}`;
    try {
      const res = await fetch(doc.imageUrl);
      if (!res.ok) throw new Error(`download ${res.status} ${res.statusText}`);
      const original = Buffer.from(await res.arrayBuffer());
      const srcType = (res.headers.get("content-type") || "").split(";")[0].trim();

      const { body, contentType, ext } = await convert(original, srcType);
      const key = `nazo/${randomUUID()}.${ext}`;
      const newUrl = `${publicBase}/${key}`;
      before += original.length;
      after += body.length;

      if (APPLY) {
        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );
        await nazos.updateOne(
          { _id: doc._id, imageUrl: doc.imageUrl },
          { $set: { imageUrl: newUrl } }
        );
      }

      ok++;
      console.log(`✓ ${label}\n    ${fmt(original.length)} → ${fmt(body.length)}  ${newUrl}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${label}\n    ${err.message}`);
    }
  }

  console.log(
    `\nDone: ${ok} ok, ${failed} failed. Size ${fmt(before)} → ${fmt(after)}` +
      (APPLY ? "" : "\n(dry run — nothing uploaded or updated; re-run with --apply)")
  );
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
