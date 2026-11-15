import { test } from "node:test";
import assert from "node:assert/strict";
import { compareMfyRows, mfyImageKey, parseMfyCsv, MFY_TYPES } from "./mfy-import.ts";

test("parses rows and maps them to YYMMT image names", () => {
  const { rows, errors } = parseMfyCsv("제목,연,월,타입,\n届かなかった手紙,2020,6,설,\n迷宮に潜む迷宮,2020,6,월,\r\nあるカジノからの挑戦状,2020,12,화,\n\n");
  assert.deepEqual(errors, []);
  assert.deepEqual(rows.map(mfyImageKey), ["20061", "20062", "20123"]);
  assert.equal(rows[0].title, "届かなかった手紙");
  assert.equal(MFY_TYPES[rows[1].type].tag, "Mystery for You 月の謎");
});

test("reports bad rows instead of guessing", () => {
  const { rows, errors } = parseMfyCsv("h\n,2020,6,설\nA,20,6,설\nB,2020,13,월\nC,2020,6,봄\nD,E,2020,6,설");
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 5);
});

test("release order is year, month, then 설 월 화", () => {
  const { rows } = parseMfyCsv("h\nc,2021,1,설\nb,2020,6,화\na,2020,6,설");
  assert.deepEqual([...rows].sort(compareMfyRows).map((r) => r.title), ["a", "b", "c"]);
});
