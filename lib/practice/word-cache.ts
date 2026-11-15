import connectToDatabase from "@/lib/db";
import PracticeWord from "@/models/practice-word";
import PracticeKanji from "@/models/practice-kanji";
import { buildWadouIndex, type WadouIndex } from "@/lib/practice/wadou";
import type { KanjiReadings, PracticeWordData } from "@/lib/practice/source";

// Words are loaded once per server instance and kept in memory, so a puzzle
// needs no DB query. Reloaded after an hour so re-imports show up without a deploy.
const TTL_MS = 60 * 60 * 1000;

let cached: { index: WadouIndex | null; loadedAt: number } | null = null;
let loading: Promise<WadouIndex | null> | null = null;

async function load(): Promise<WadouIndex | null> {
  await connectToDatabase();
  const [words, kanji] = await Promise.all([
    PracticeWord.find({ disabled: { $ne: true } }, { _id: 0, expression: 1, reading: 1, ruby: 1, meaning: 1 })
      .lean<PracticeWordData[]>(),
    PracticeKanji.find({}, { _id: 0, literal: 1, on: 1, kun: 1 }).lean<KanjiReadings[]>(),
  ]);
  return words.length ? buildWadouIndex(words, kanji) : null;
}

/** The wadou index, or null when there are no words (import not run yet). */
export async function getWadouIndex(): Promise<WadouIndex | null> {
  if (cached && Date.now() - cached.loadedAt < TTL_MS) return cached.index;
  if (!loading) {
    loading = load()
      .then((index) => {
        cached = { index, loadedAt: Date.now() };
        return index;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}
