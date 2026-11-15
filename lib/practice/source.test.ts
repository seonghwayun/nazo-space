import { test } from "node:test";
import assert from "node:assert/strict";
import { shortMeaning, isTwoKanji, parseRuby, splitReadings } from "./source.ts";

test("shortMeaning keeps the first sense", () => {
  assert.equal(shortMeaning("1. 시간 2. 때 3. 시각"), "시간");
  assert.equal(shortMeaning("된장"), "된장");
  assert.equal(shortMeaning("1. 근본"), "근본");
});

test("isTwoKanji accepts exactly two kanji", () => {
  assert.equal(isTwoKanji("時間"), true);
  assert.equal(isTwoKanji("時々"), true);
  assert.equal(isTwoKanji("〜件"), false);
  assert.equal(isTwoKanji("時間割"), false);
  assert.equal(isTwoKanji("お茶"), false);
});

test("parseRuby turns pairs into segments", () => {
  assert.deepEqual(parseRuby('[["時","じ"],["間","かん"]]'), [
    { base: "時", ruby: "じ" },
    { base: "間", ruby: "かん" },
  ]);
  assert.deepEqual(parseRuby('[["大人","おとな"]]'), [{ base: "大人", ruby: "おとな" }]);
  assert.deepEqual(parseRuby('[["の"]]'), [{ base: "の" }]);
});

test("splitReadings splits on the middle dot", () => {
  assert.deepEqual(splitReadings("カン・ケン"), ["カン", "ケン"]);
  assert.deepEqual(splitReadings(null), []);
  assert.deepEqual(splitReadings(""), []);
});
