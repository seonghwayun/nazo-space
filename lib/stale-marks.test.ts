import { test } from "node:test";
import assert from "node:assert/strict";
import { createStaleMarks } from "./stale-marks.ts";

test("a stale mark is consumed exactly once", () => {
  const marks = createStaleMarks();
  marks.mark("abc");
  assert.equal(marks.consume("abc"), true);
  assert.equal(marks.consume("abc"), false);
});

test("consume is false for ids that were never marked", () => {
  const marks = createStaleMarks();
  marks.mark("abc");
  assert.equal(marks.consume("xyz"), false);
});
