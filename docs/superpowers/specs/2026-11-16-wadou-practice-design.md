# Practice: 和同開珎 puzzles

**Size:** small project (full design, builder check done inline)

## Intent
Nazopt (the personal iOS app) has a 謎解き tab with puzzles you solve directly. Bring that idea to
nazo-space so **visitors** can practice. Start with one type: 和同開珎. Four kanji sit around an empty
center, and one kanji placed in the middle makes four two-kanji words when read along the arrows.

Goals:
- Anyone (no login) can solve 和同開珎 puzzles one after another on a `/practice` page.
- Every puzzle has exactly one answer.
- Hints and an answer screen like Nazopt's: four words with furigana and a Korean meaning.
- The page structure leaves room for more puzzle types later.

Non-goals:
- Per-user records, stats, daily sets, or streaks.
- Other puzzle types (五十音, アナグラム, …).
- Admin UI for words. The import script is the only way in.

Anti-goals:
- Publishing content we have no right to. The Korean meanings in Nazopt's Anki deck (likely
  from Naver) must not appear on the site.
- Heavy responses or noticeable lag per puzzle.

## Constraints
- **Licensing.** Word spellings, readings, and kanji on/kun readings are facts and may be used.
  Korean meanings are written fresh (see Data). The deck's 훈음 (`hunDaily`, e.g. 사이 간) is not used.
- Next.js 16 app router, Mongoose on MongoDB (`lib/db.ts` connection cache), deployed serverless.
- Node 24 (`node:sqlite` is available to scripts).

## Approaches
| | Approach | Trade-off |
|---|---|---|
| A | Pre-generate puzzles offline and store them in MongoDB | Each puzzle can be managed one by one, but adding puzzles means re-running the script, and variety is fixed. |
| **B (picked)** | Store words in MongoDB, generate puzzles in the API | Unlimited variety, and new words add puzzles automatically. Words (~3,200, ~300 KB) load once per server instance and stay in memory. After that, generation takes under 1 ms with no DB query. |
| C | Bundle a JSON file in the app, no DB | Simplest, but would have to move to the DB as soon as records or stats are added. |

The user picked B, as long as traffic stays small. Each puzzle response is about 1 KB. The word
list never leaves the server.

## Data
**Source:** Nazopt's `Content.sqlite`, using the same filter as `PuzzleSource.load`:
- `word` rows (JLPT N5–N1) that are exactly two kanji and whose two kanji are both elementary
  (漢検 10–5級, `kankenOrder` 1–6). About 3,250 words.
- Two-kanji `nazoTerm` rows (the user's own `vocab.yaml`). Their meanings are the user's own
  writing and can be kept as they are.
- Duplicate expressions keep the first one, easier JLPT level first.
- Kanji on/kun readings for every kanji that appears, for hint 2.

**Meanings:** a script asks Claude (`claude-haiku-5-5`, batches of ~100 words) for a short
Korean gloss of each word, one or two senses, at most ~20 characters. The prompt gets only the
expression and reading, never the deck's meaning. Output is reviewed by spot-check and committed.

**Pipeline** (two scripts, mirroring `import:mfy`'s dry-run / `--apply` style):
1. `scripts/build-practice-words.mjs <Content.sqlite path>` reads the DB and calls Claude for
   meanings (`ANTHROPIC_API_KEY`). It writes `data/practice-words.json`
   (`{ words: [...], kanji: [...] }`). The script can be resumed: words that already have a
   meaning in the existing JSON are skipped.
2. `pnpm import:practice` (`scripts/import-practice.mjs`) upserts the JSON into MongoDB.
   Dry run by default, `--apply` to write.

**Collections**
```ts
PracticeWord  { expression: string (unique), reading: string,
                ruby: { base: string, ruby?: string }[],   // from Content.sqlite `ruby` JSON [["時","じ"],["間","かん"]]
                meaning: string, disabled?: boolean }
PracticeKanji { literal: string (unique), on: string[], kun: string[] }
```
`disabled: true` takes an odd word out of every puzzle without deleting it.

## Generator (`lib/practice/wadou.ts`, pure, unit-tested)
A port of `WadouPuzzles.swift` and the index in `PuzzleGenerator.init`:
- Index: for each word `XY` (X ≠ Y), add `(outer: X, outerFirst: true)` under `Y` and
  `(outer: Y, outerFirst: false)` under `X`. The centers are the kanji with ≥ 4 distinct outers.
- Pick a random center and four spokes with distinct outers.
- Reject the puzzle if any other center completes all four words. Up to 50 tries per request.
- Distractors: 3 kanji. Prefer other centers that complete ≥ 2 of the words, and never use an outer kanji.
- Layout: top, left, right, bottom. Each spoke's arrow points into the center when the outer comes
  first (`外→中`), and out of the center otherwise (`中→外`).
- **Puzzle id:** `center` + the four outers in layout order, e.g. `間-時,空,人,期`. Given an id, the
  generator rebuilds the same puzzle (placement included), so ids can later back share links or stats.
- `rng` is injected so the tests can be deterministic.

Kept in memory by `lib/practice/word-cache.ts`. It holds the loaded words and kanji at module
level and builds the index once. It reloads after 1 hour so re-imports show up without a deploy.

## API
`GET /api/practice/wadou?exclude=<id>,<id>…` returns one puzzle:
```ts
{ id, spokes: { kanji, outerFirst }[4],  // top, left, right, bottom
  answer, choices: string[4],
  hints: [meanings joined by " · ", "on: カン・ケン / kun: あいだ・ま"],
  words: { expression, ruby, meaning }[4] }
```
- `exclude` holds the client's recent ids (the last 30). The generator skips them.
- The answer is in the response. It's practice, so cheating doesn't matter, and checking on the
  client needs no extra round trip.
- `Cache-Control: no-store`.

## Page `/practice`
- Bottom nav gets a 5th item, **연습** (lucide `Puzzle` icon), between 검색 and 참고.
- `/practice` lists puzzle types as cards in the `/reference` style. For now there is one card,
  和同開珎, which links to `/practice/wadou`.
- `/practice/wadou`:
  ```
          時
          ↓
   空 → [ ? ] → 人        (arrow direction per spoke)
          ↓
          期
  [ 답 입력 ________ ] [확인]
  [힌트] [선택지 보기] [모르겠어요]
  ```
- Answer by typing (IME) or by picking from 「선택지 보기」, which shows the four choices as buttons.
  Grading trims whitespace and compares the first kanji.
- Wrong: shake the input and let them try again. Hints show one step at a time (meanings, then readings).
- Correct or 「모르겠어요」: the center fills in, and the four words appear with furigana and meaning.
  「다음 문제」 fetches the next one.
- Works at phone width and in dark mode, using existing tokens and components (`MainLayout`, `ui/*`).

## Builder's calls (my decisions, user can override)
- Bottom-nav placement and the name 연습.
- Haiku model for meanings, gloss length, and committing `data/practice-words.json`.
- 1-hour cache TTL, 50 generation tries, last-30 exclude list.
- No server-side answer check.
- An error state ("문제를 불러오지 못했어요" + retry) if the API fails.

## Testing
- `lib/practice/wadou.test.ts` (node --test, like the other `lib` tests), using a small fixed word list:
  unique-answer rejection, distinct outers, distractors never equal outers or the answer,
  id round-trip, arrow direction.
- A grading-normalization test.
- Manual run of the page on mobile width.
