#!/usr/bin/env node
/**
 * Import data/practice-words.json (built by scripts/build-practice-words.mjs)
 * into the practicewords and practicekanjis collections.
 *
 * Upserts by expression / literal. Never deletes and never touches `disabled`;
 * rows missing from the JSON are only reported.
 *
 * Usage:
 *   pnpm import:practice           # dry run: counts only
 *   pnpm import:practice --apply   # write
 *
 * Required env: MONGODB_URI
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const root = path.resolve(import.meta.dirname, "..");
const { words, kanji } = JSON.parse(await readFile(path.join(root, "data/practice-words.json"), "utf8"));

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI, { dbName: "nazo-space" });
const db = mongoose.connection.db;

// Field names must match models/practice-word.ts and models/practice-kanji.ts.
const targets = [
  { collection: "practicewords", key: "expression", fields: ["reading", "ruby", "meaning"], items: words },
  { collection: "practicekanjis", key: "literal", fields: ["on", "kun"], items: kanji },
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const { collection, key, fields, items } of targets) {
  const col = db.collection(collection);
  const existing = new Map(
    (await col.find({}, { projection: { _id: 0, [key]: 1, ...Object.fromEntries(fields.map((f) => [f, 1])) } }).toArray())
      .map((doc) => [doc[key], doc])
  );
  const counts = { new: 0, changed: 0, unchanged: 0 };
  const ops = [];
  for (const item of items) {
    const doc = existing.get(item[key]);
    const set = Object.fromEntries(fields.map((f) => [f, item[f]]));
    if (doc && fields.every((f) => same(doc[f], item[f]))) {
      counts.unchanged++;
      continue;
    }
    counts[doc ? "changed" : "new"]++;
    const now = new Date();
    ops.push({
      updateOne: {
        filter: { [key]: item[key] },
        update: { $set: { ...set, updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    });
  }
  const inJson = new Set(items.map((i) => i[key]));
  const missing = [...existing.keys()].filter((k) => !inJson.has(k));
  console.log(
    `${collection}: new ${counts.new}, changed ${counts.changed}, unchanged ${counts.unchanged}, missing from JSON ${missing.length}` +
      (missing.length ? ` (${missing.slice(0, 10).join(" ")}${missing.length > 10 ? " …" : ""})` : "")
  );
  if (APPLY && ops.length) {
    await col.createIndex({ [key]: 1 }, { unique: true });
    for (let i = 0; i < ops.length; i += 1000) await col.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
  }
}

if (!APPLY) console.log("Dry run. Re-run with --apply to write.");
await mongoose.disconnect();
