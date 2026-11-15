import { test } from "node:test";
import assert from "node:assert/strict";
import { arrowFor, buildWadouIndex, generateWadou, type WadouPuzzle } from "./wadou.ts";
import type { KanjiReadings, PracticeWordData } from "./source.ts";

/** Deterministic rng in [0, 1). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const MEANINGS: Record<string, string> = {
  時間: "시간", 空間: "공간", 人間: "인간", 期間: "기간", 年間: "연간", 時代: "시대", 人生: "인생",
};
function words(...expressions: string[]): PracticeWordData[] {
  return expressions.map((expression) => ({
    expression,
    reading: "",
    ruby: [...expression].map((base) => ({ base })),
    meaning: MEANINGS[expression] ?? expression + "뜻",
  }));
}
const KANJI: KanjiReadings[] = [{ literal: "間", on: ["カン", "ケン"], kun: ["あいだ", "ま"] }];

const fixtureA = words("時間", "空間", "人間", "期間", "年間", "時代", "人生");

function outers(p: WadouPuzzle) {
  return p.spokes.map((s) => s.kanji);
}

test("a puzzle with one possible center is generated", () => {
  const p = generateWadou(buildWadouIndex(fixtureA, KANJI), lcg(1));
  assert.ok(p);
  assert.equal(p.answer, "間");
});

test("a puzzle is rejected when another center completes all four words", () => {
  const index = buildWadouIndex(
    words("時間", "空間", "人間", "期間", "時代", "空代", "人代", "期代"),
    KANJI
  );
  for (let seed = 0; seed < 50; seed++) assert.equal(generateWadou(index, lcg(seed)), null);
});

test("puzzle shape holds across seeds", () => {
  const index = buildWadouIndex(fixtureA, KANJI);
  for (let seed = 0; seed < 200; seed++) {
    const p = generateWadou(index, lcg(seed));
    assert.ok(p, `seed ${seed}`);
    assert.equal(new Set(outers(p)).size, 4);
    assert.equal(p.choices.length, 4);
    assert.equal(new Set(p.choices).size, 4);
    assert.ok(p.choices.includes(p.answer));
    assert.ok(!outers(p).includes(p.answer));
    for (const c of p.choices) if (c !== p.answer) assert.ok(!outers(p).includes(c), `choice ${c} is an outer`);
    p.spokes.forEach((s, i) => {
      assert.equal(p.words[i].expression, s.outerFirst ? s.kanji + p.answer : p.answer + s.kanji);
    });
  }
});

test("a two-way pair never puts the same outer twice", () => {
  const index = buildWadouIndex(words("日本", "本日", "本人", "本気", "本当", "本来", "大学", "生活"), []);
  for (let seed = 0; seed < 100; seed++) {
    const p = generateWadou(index, lcg(seed));
    assert.ok(p);
    assert.equal(new Set(outers(p)).size, 4);
  }
});

test("words made of one character twice are ignored", () => {
  const index = buildWadouIndex(words("人人", "時間", "空間", "人間"), []);
  assert.equal(generateWadou(index, lcg(3)), null);
});

test("arrows show reading order", () => {
  assert.equal(arrowFor("top", true), "↓");
  assert.equal(arrowFor("top", false), "↑");
  assert.equal(arrowFor("left", true), "→");
  assert.equal(arrowFor("left", false), "←");
  assert.equal(arrowFor("right", true), "←");
  assert.equal(arrowFor("right", false), "→");
  assert.equal(arrowFor("bottom", true), "↑");
  assert.equal(arrowFor("bottom", false), "↓");
});

test("hints list the meanings, then the center's readings", () => {
  const p = generateWadou(buildWadouIndex(fixtureA, KANJI), lcg(7));
  assert.ok(p);
  assert.equal(p.hints[0], p.words.map((w) => w.meaning).join(" · "));
  assert.equal(p.hints[1], "음독 カン・ケン / 훈독 あいだ・ま");
});

test("the readings hint leaves out an empty side", () => {
  const p = generateWadou(
    buildWadouIndex(fixtureA, [{ literal: "間", on: ["カン"], kun: [] }]),
    lcg(7)
  );
  assert.equal(p?.hints[1], "음독 カン");
});

test("no puzzle when there aren't three distractors to offer", () => {
  const index = buildWadouIndex(words("時間", "空間", "人間", "期間"), KANJI);
  assert.equal(generateWadou(index, lcg(1)), null);
});
