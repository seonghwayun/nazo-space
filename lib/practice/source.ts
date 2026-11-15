// Pure helpers (no imports) so they can be unit-tested with `node --test`.
//
// Turns rows of Nazopt's Content.sqlite into practice words. Only facts
// (spelling, readings) and the first short sense of each word are kept.

export type RubySegment = { base: string; ruby?: string };

export type PracticeWordData = {
  expression: string;
  reading: string;
  ruby: RubySegment[];
  meaning: string;
};

export type KanjiReadings = { literal: string; on: string[]; kun: string[] };

/** `1. 시간 2. 때 3. 시각` → `시간` (same cut as Nazopt's PuzzleSource.shortMeaning). */
export function shortMeaning(summary: string): string {
  let text = summary.replace(/^\d+\.\s*/, "");
  const next = text.search(/\s+\d+\.\s/);
  if (next >= 0) text = text.slice(0, next);
  return text.trim();
}

export function isKanji(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined || ch.length > 2) return false;
  return (cp >= 0x4e00 && cp <= 0x9fff) || cp === 0x3005;
}

export function isTwoKanji(expression: string): boolean {
  const chars = [...expression];
  return chars.length === 2 && chars.every(isKanji);
}

/** `[["時","じ"],["間","かん"]]` → segments; a one-element pair has no ruby. */
export function parseRuby(json: string): RubySegment[] {
  const pairs = JSON.parse(json) as string[][];
  return pairs.map(([base, ruby]) => (ruby ? { base, ruby } : { base }));
}

export function splitReadings(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("・")
    .map((s) => s.trim())
    .filter(Boolean);
}
