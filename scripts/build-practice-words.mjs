#!/usr/bin/env node
/**
 * Build data/practice-words.json from Nazopt's Content.sqlite.
 *
 * Words: JLPT words (N5 → N1) that are exactly two kanji, both elementary
 * (漢検 10–5級, kankenOrder 1–6), plus two-kanji 謎解き terms. Duplicates keep
 * the first. Meaning = the first short sense only.
 * Kanji: on/kun readings of every kanji the words use.
 *
 * Usage:
 *   node scripts/build-practice-words.mjs [path/to/Content.sqlite]
 *   (default ../nazopt-ios/App/Resources/Content.sqlite)
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { isTwoKanji, parseRuby, shortMeaning, splitReadings } from "../lib/practice/source.ts";

const root = path.resolve(import.meta.dirname, "..");
const dbPath = process.argv[2] ?? path.resolve(root, "../nazopt-ios/App/Resources/Content.sqlite");
const outPath = path.join(root, "data/practice-words.json");

const db = new DatabaseSync(dbPath, { readOnly: true });

const elementary = new Set(
  db.prepare("select literal from kanji where kankenOrder between 1 and 6").all().map((r) => r.literal)
);

const words = [];
const seen = new Set();
function add(expression, reading, ruby, meaning) {
  // A word without a meaning would leave a hole in the meaning hint (名詞 has none).
  if (!isTwoKanji(expression) || !meaning || seen.has(expression)) return;
  seen.add(expression);
  words.push({ expression, reading: reading ?? "", ruby: parseRuby(ruby), meaning });
}

const byLevel = db.prepare(
  "select expression, reading, ruby, summary from word where jlptLevel = ? order by sortOrder"
);
for (const level of [5, 4, 3, 2, 1]) {
  for (const row of byLevel.all(level)) {
    if (![...row.expression].every((ch) => elementary.has(ch))) continue;
    add(row.expression, row.reading, row.ruby, shortMeaning(row.summary));
  }
}
for (const row of db.prepare("select expression, reading, ruby, meaning from nazoTerm order by sortOrder").all()) {
  add(row.expression, row.reading, row.ruby, row.meaning);
}

const kanjiQuery = db.prepare("select literal, onReadings, kunReadings from kanji where literal = ?");
const used = [...new Set(words.flatMap((w) => [...w.expression]))].sort();
const kanji = [];
for (const literal of used) {
  const row = kanjiQuery.get(literal);
  if (row) kanji.push({ literal, on: splitReadings(row.onReadings), kun: splitReadings(row.kunReadings) });
}

// One entry per line: compact, but diffs stay readable.
const lines = (items) => items.map((item) => "    " + JSON.stringify(item)).join(",\n");
await writeFile(outPath, `{\n  "words": [\n${lines(words)}\n  ],\n  "kanji": [\n${lines(kanji)}\n  ]\n}\n`);
console.log(`words: ${words.length}, kanji: ${kanji.length} → ${path.relative(root, outPath)}`);
