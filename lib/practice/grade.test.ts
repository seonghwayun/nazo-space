import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrect, normalizeAnswer } from "./grade.ts";

test("whitespace and trailing text don't matter", () => {
  assert.equal(isCorrect("間", "間"), true);
  assert.equal(isCorrect(" 間 ", "間"), true);
  assert.equal(isCorrect("　間", "間"), true);
  assert.equal(isCorrect("間違", "間"), true);
});

test("a reading or an empty answer is wrong", () => {
  assert.equal(isCorrect("かん", "間"), false);
  assert.equal(isCorrect("", "間"), false);
  assert.equal(isCorrect("   ", "間"), false);
});

test("normalizeAnswer keeps a surrogate pair whole", () => {
  assert.equal(normalizeAnswer("𠮷野"), "𠮷");
});
