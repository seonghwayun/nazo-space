// Pure helpers (relative imports only) so they can be unit-tested with `node --test`.
//
// 和同開珎: four kanji sit around an empty center; one kanji in the middle makes
// four two-kanji words read along the arrows. Ported from Nazopt's WadouPuzzles.swift.

import type { KanjiReadings, PracticeWordData, RubySegment } from "./source.ts";

export type Spoke = { kanji: string; outerFirst: boolean };
export type SpokePosition = "top" | "left" | "right" | "bottom";

export type WadouPuzzle = {
  /** top, left, right, bottom */
  spokes: [Spoke, Spoke, Spoke, Spoke];
  answer: string;
  /** Four, shuffled, one of them the answer. */
  choices: string[];
  /** Meanings of the four words, then the center's readings. */
  hints: [string, string];
  /** The four words, in spoke order. */
  words: { expression: string; ruby: RubySegment[]; meaning: string }[];
};

type IndexedSpoke = Spoke & { word: PracticeWordData };

export type WadouIndex = {
  centers: string[];
  spokes: Map<string, IndexedSpoke[]>;
  words: Map<string, PracticeWordData>;
  kanji: Map<string, KanjiReadings>;
  /** Every character in the words: fallback distractors. */
  characters: string[];
};

const POSITIONS: SpokePosition[] = ["top", "left", "right", "bottom"];
const MAX_TRIES = 50;

export function buildWadouIndex(words: PracticeWordData[], kanji: KanjiReadings[]): WadouIndex {
  const spokes = new Map<string, IndexedSpoke[]>();
  const byExpression = new Map<string, PracticeWordData>();
  const characters = new Set<string>();
  const push = (center: string, spoke: IndexedSpoke) => {
    const list = spokes.get(center);
    if (list) list.push(spoke);
    else spokes.set(center, [spoke]);
  };
  for (const word of words) {
    const [x, y] = [...word.expression];
    if (!x || !y || x === y || byExpression.has(word.expression)) continue;
    byExpression.set(word.expression, word);
    characters.add(x).add(y);
    push(y, { kanji: x, outerFirst: true, word });
    push(x, { kanji: y, outerFirst: false, word });
  }
  const centers = [...spokes.keys()]
    .filter((c) => new Set(spokes.get(c)!.map((s) => s.kanji)).size >= 4)
    .sort();
  return {
    centers,
    spokes,
    words: byExpression,
    kanji: new Map(kanji.map((k) => [k.literal, k])),
    characters: [...characters].sort(),
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function tryOnce(index: WadouIndex, rng: () => number): WadouPuzzle | null {
  const center = index.centers[Math.floor(rng() * index.centers.length)];
  const chosen: IndexedSpoke[] = [];
  for (const spoke of shuffle(index.spokes.get(center)!, rng)) {
    if (chosen.length === 4) break;
    if (!chosen.some((s) => s.kanji === spoke.kanji)) chosen.push(spoke);
  }
  if (chosen.length < 4) return null;

  const completes = (kanji: string) =>
    chosen.filter((s) => index.words.has(s.outerFirst ? s.kanji + kanji : kanji + s.kanji)).length;
  const rivals = index.centers.filter((c) => c !== center);
  if (rivals.some((c) => completes(c) === 4)) return null;

  // Distractors that fit some of the words are harder to rule out.
  const taken = new Set([center, ...chosen.map((s) => s.kanji)]);
  const distractors: string[] = [];
  const pick = (pool: string[]) => {
    for (const k of shuffle(pool, rng)) {
      if (distractors.length === 3) return;
      if (!taken.has(k)) {
        taken.add(k);
        distractors.push(k);
      }
    }
  };
  pick(rivals.filter((c) => completes(c) >= 2));
  pick(rivals);
  pick(index.characters);
  if (distractors.length < 3) return null;

  const meanings = chosen.map((s) => s.word.meaning).join(" · ");
  const readings = index.kanji.get(center);
  const readingHint = [
    readings?.on.length ? `음독 ${readings.on.join("・")}` : "",
    readings?.kun.length ? `훈독 ${readings.kun.join("・")}` : "",
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    spokes: chosen.map(({ kanji, outerFirst }) => ({ kanji, outerFirst })) as WadouPuzzle["spokes"],
    answer: center,
    choices: shuffle([center, ...distractors], rng),
    hints: [meanings, readingHint],
    words: chosen.map(({ word }) => ({ expression: word.expression, ruby: word.ruby, meaning: word.meaning })),
  };
}

/** A random puzzle with exactly one answer, or null if none was found in 50 tries. */
export function generateWadou(index: WadouIndex, rng: () => number): WadouPuzzle | null {
  if (index.centers.length === 0) return null;
  for (let i = 0; i < MAX_TRIES; i++) {
    const puzzle = tryOnce(index, rng);
    if (puzzle) return puzzle;
  }
  return null;
}

/** Arrows follow reading order: outer → center when the outer comes first. */
export function arrowFor(position: SpokePosition, outerFirst: boolean): "↓" | "↑" | "→" | "←" {
  const inward = { top: "↓", left: "→", right: "←", bottom: "↑" } as const;
  const outward = { top: "↑", left: "←", right: "→", bottom: "↓" } as const;
  return outerFirst ? inward[position] : outward[position];
}

export { POSITIONS as SPOKE_POSITIONS };
