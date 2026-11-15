# 和同開珎 Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visitors solve 和同開珎 puzzles (one center kanji completing four two-kanji words) on `/practice/wadou`, with puzzles generated on the server from words stored in MongoDB.

**Architecture:** A script turns Nazopt's `Content.sqlite` into a committed `data/practice-words.json`. A second script imports it into two Mongo collections. The API loads both collections into module memory (1 h TTL), builds an index once, and generates a puzzle per request with a pure, unit-tested generator ported from `WadouPuzzles.swift`. A client page renders the cross figure, takes typed or multiple-choice answers, gives hints, and shows the four words.

**Tech Stack:** Next.js 16 app router, React 19, Mongoose 9, Tailwind 4, `node --test` with type stripping (Node 24), `node:sqlite`.

**Spec:** `docs/superpowers/specs/2026-11-16-wadou-practice-design.md`

## Global Constraints
- No login required anywhere in this feature.
- Meanings: first sense of the deck `summary` only (`1. 시간 2. 때 3. 시각` → `시간`). `nazoTerm` keeps its own `meaning`. Never use `hunDaily`, `senses`, or example sentences.
- Word filter: `word` rows that are exactly two kanji, both with `kankenOrder` 1–6. Add two-kanji `nazoTerm` rows without the kanken filter. Same characters twice (人人) are skipped by the index. Duplicate expressions keep the first, in order JLPT 5→1, then nazoTerm.
- Every puzzle has exactly one answer. No other center may complete all four words.
- Response per puzzle ≈ 1 KB. The word list never leaves the server. `Cache-Control: no-store`.
- Cache TTL 1 hour. Up to 50 generation tries per request. No puzzle id, no repeat avoidance.
- `lib/practice/*.ts` modules other than `word-cache.ts` are pure (no `@/` imports, relative `.ts` imports) so `node --test` can run them, as the other `lib` helpers do.
- UI copy is Korean. Works at phone width and in dark mode using existing tokens and `components/ui/*`.

## Review Focus
1. **DB empty (import not run yet):** the API answers 503 `{ error }` and the page shows 「문제를 불러오지 못했어요」 with a retry button. Covered in Task 4 (null-data path) and Task 5 (error state).
2. **Enter while composing Japanese in an IME:** Enter that confirms a kana→kanji conversion must not submit. Covered in Task 5 (`isComposing` guard, manual check).
3. **Same kanji on two spokes** (two-way pairs like 日本/本日 around 本): never the same outer twice. Covered in Task 3 two-way fixture test.
4. **Answer typed as a reading or with extra text** (`かん`, ` 間 `, `間違`): `かん` is wrong without crashing, and ` 間 ` / `間違` count as 間 (first-character rule). Covered in Task 3 grade tests.
5. **Rapid 「다음 문제」 taps:** only the latest response is shown. A stale fetch is aborted, following the precedent in `916afba`. Covered in Task 5.

---

### Task 1: Word source helpers and JSON build script

**Files:**
- Create: `lib/practice/source.ts`, `lib/practice/source.test.ts`
- Create: `scripts/build-practice-words.mjs`
- Create: `data/practice-words.json` (generated, committed)

**Interfaces:**
- Produces (`lib/practice/source.ts`):
  - `type RubySegment = { base: string; ruby?: string }`
  - `type PracticeWordData = { expression: string; reading: string; ruby: RubySegment[]; meaning: string }`
  - `type KanjiReadings = { literal: string; on: string[]; kun: string[] }`
  - `shortMeaning(summary: string): string`
  - `isKanji(ch: string): boolean` (CJK Unified Ideographs U+4E00–U+9FFF, plus 々 U+3005)
  - `isTwoKanji(expression: string): boolean` (exactly two code points, both kanji)
  - `parseRuby(json: string): RubySegment[]` (`[["時","じ"],["間","かん"]]` → `[{base:"時",ruby:"じ"},{base:"間",ruby:"かん"}]`, a one-element pair has no `ruby`)
  - `splitReadings(text: string | null): string[]` (splits on `・`, trims, drops empties, so `null` → `[]`)
- `data/practice-words.json` shape: `{ words: PracticeWordData[]; kanji: KanjiReadings[] }`

- [ ] **Step 1: Write failing tests** in `lib/practice/source.test.ts`:
```ts
test("shortMeaning keeps the first sense", () => {
  assert.equal(shortMeaning("1. 시간 2. 때 3. 시각"), "시간");
  assert.equal(shortMeaning("된장"), "된장");
  assert.equal(shortMeaning("1. 근본"), "근본");
});
test("isTwoKanji", () => {
  assert.equal(isTwoKanji("時間"), true);
  assert.equal(isTwoKanji("時々"), true);
  assert.equal(isTwoKanji("〜件"), false);
  assert.equal(isTwoKanji("時間割"), false);
  assert.equal(isTwoKanji("お茶"), false);
});
test("parseRuby", () => {
  assert.deepEqual(parseRuby('[["時","じ"],["間","かん"]]'), [{ base: "時", ruby: "じ" }, { base: "間", ruby: "かん" }]);
  assert.deepEqual(parseRuby('[["大人","おとな"]]'), [{ base: "大人", ruby: "おとな" }]);
  assert.deepEqual(parseRuby('[["の"]]'), [{ base: "の" }]);
});
test("splitReadings", () => {
  assert.deepEqual(splitReadings("カン・ケン"), ["カン", "ケン"]);
  assert.deepEqual(splitReadings(null), []);
  assert.deepEqual(splitReadings(""), []);
});
```
- [ ] **Step 2:** Run `node --test lib/practice/source.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement `lib/practice/source.ts`. `shortMeaning` follows Nazopt: strip `^\d+\.\s*`, cut at the first `\s+\d+\.\s`, trim.
- [ ] **Step 4:** Run `node --test lib/practice/source.test.ts` → PASS.
- [ ] **Step 5:** Write `scripts/build-practice-words.mjs [path]`. Default path `../nazopt-ios/App/Resources/Content.sqlite`. Use `DatabaseSync` from `node:sqlite` (read-only) and helpers from `../lib/practice/source.ts`. Copy the run flags from the `import:mfy` script. Queries:
  - Elementary set: `select literal from kanji where kankenOrder between 1 and 6`.
  - Words: `select expression, reading, ruby, summary from word where jlptLevel = ? order by sortOrder` for levels 5,4,3,2,1. Keep rows where `isTwoKanji` holds and both chars are elementary. `meaning = shortMeaning(summary)`, `reading ?? ""`.
  - Terms: `select expression, reading, ruby, meaning from nazoTerm order by sortOrder`, keeping `isTwoKanji`.
  - Dedupe by expression (first wins).
  - Kanji: for every character used, `select literal, onReadings, kunReadings from kanji where literal = ?` → `KanjiReadings` via `splitReadings`.
  - Write `data/practice-words.json` (2-space indent). Print `words: N, kanji: M`.
- [ ] **Step 6:** Run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/build-practice-words.mjs`. Expected: `words:` ≈ 3,200–3,400, `kanji:` ≈ 600–1,100. Spot-check with `node -e` that `時間` has meaning `시간` and ruby with two segments.
- [ ] **Step 7:** Commit `lib/practice/source*.ts scripts/build-practice-words.mjs data/practice-words.json` with `feat: build practice word list from Nazopt content`.

### Task 2: Mongo models and import script

**Files:**
- Create: `models/practice-word.ts`, `models/practice-kanji.ts`
- Create: `scripts/import-practice.mjs`
- Modify: `package.json` (script `import:practice`, same `node` flags and env-file options as `import:mfy`)

**Interfaces:**
- Consumes: `data/practice-words.json` (Task 1 shape).
- Produces:
  - `PracticeWord` model (collection `practicewords`): `{ expression: string unique, reading: string, ruby: [{ base: String, ruby: String }] (_id: false), meaning: string, disabled?: boolean }`, timestamps.
  - `PracticeKanji` model: `{ literal: string unique, on: string[], kun: string[] }`.
  - Both use the `mongoose.models.X || mongoose.model(...)` guard as `models/tag.ts` does.

- [ ] **Step 1:** Write both models.
- [ ] **Step 2:** Write `scripts/import-practice.mjs`. The default is a dry run that prints counts of new / changed / unchanged / missing-from-JSON for both collections. `--apply` runs `bulkWrite` upserts keyed on `expression` / `literal` (`$set` reading, ruby, meaning / on, kun). It never touches `disabled` and never deletes; missing-from-JSON rows are only reported. Connect with `MONGODB_URI`, `dbName: "nazo-space"`. The script defines its own schemas inline, since `.mjs` can't import the TS models with path aliases. Keep the field names identical to the models.
- [ ] **Step 3:** Run `pnpm import:practice` → dry-run report, no writes. Then `pnpm import:practice --apply`, then `pnpm import:practice` again → everything `unchanged`.
- [ ] **Step 4:** `pnpm lint` passes. Commit with `feat: import practice words into MongoDB`.

### Task 3: Wadou generator and grading

**Files:**
- Create: `lib/practice/wadou.ts`, `lib/practice/wadou.test.ts`
- Create: `lib/practice/grade.ts`, `lib/practice/grade.test.ts`

**Interfaces:**
- Consumes: `PracticeWordData`, `KanjiReadings`, `RubySegment` from `./source.ts`.
- Produces (`wadou.ts`):
  - `type Spoke = { kanji: string; outerFirst: boolean }`
  - `type SpokePosition = "top" | "left" | "right" | "bottom"`
  - `type WadouPuzzle = { spokes: [Spoke, Spoke, Spoke, Spoke] /* top,left,right,bottom */; answer: string; choices: string[] /* 4, shuffled, contains answer */; hints: [string, string]; words: { expression: string; ruby: RubySegment[]; meaning: string }[] /* layout order */ }`
  - `type WadouIndex` (opaque to callers: centers, spokes per center, word map, kanji map)
  - `buildWadouIndex(words: PracticeWordData[], kanji: KanjiReadings[]): WadouIndex`
  - `generateWadou(index: WadouIndex, rng: () => number): WadouPuzzle | null`
  - `arrowFor(position: SpokePosition, outerFirst: boolean): "↓" | "↑" | "→" | "←"`. The arrow shows reading order: from outer to center when `outerFirst`, otherwise from center to outer.
- Produces (`grade.ts`): `normalizeAnswer(input: string): string` (strip all whitespace including U+3000, return the first code point or `""`), `isCorrect(input: string, answer: string): boolean`.

Index and generation follow the spec's Generator section: index `XY` under `Y` (outer X, `outerFirst: true`) and under `X` (outer Y, `false`), skipping X = Y. Centers have ≥ 4 distinct outers. Pick a random center, take shuffled spokes with distinct outers until 4, and reject the puzzle if any other center completes all 4. Distractors are up to 3 rivals that complete ≥ 2 words, then random rivals, never an outer or the answer. Retry up to 50 times, and return `null` if all tries fail. Hints: `meanings.join(" · ")` and `음독 ${on.join("・")} / 훈독 ${kun.join("・")}`, leaving out an empty side. Skip disabled words before calling `buildWadouIndex` (Task 4 does this).

- [ ] **Step 1: Write failing tests** in `wadou.test.ts` with a fixed word list and a seeded rng (a small LCG defined in the test file):
  - Fixture A (unique): 時間 空間 人間 期間 年間 plus distractor-only words 時代 人生. A puzzle with center 間 is returned, and `answer === "間"`.
  - Fixture B (ambiguous): 時間 空間 人間 期間 + 時代 空代 人代 期代. `generateWadou` returns `null` (both 間 and 代 complete all four).
  - For 200 seeds on fixture A: 4 distinct outers; `choices.length === 4`; `choices` has no duplicates and contains `answer`; no choice equals an outer except the answer, which is never an outer; every `words[i].expression` equals `outerFirst ? outer + answer : answer + outer`.
  - Two-way pair: words 日本 本日 + 本人 本気 本当 本来. A center-本 puzzle never uses outer 日 twice.
  - `arrowFor`: top/true `↓`, top/false `↑`, left/true `→`, left/false `←`, right/true `←`, right/false `→`, bottom/true `↑`, bottom/false `↓`.
  - Hints: `hints[0]` contains every word meaning joined by ` · `. `hints[1]` is `음독 カン・ケン / 훈독 あいだ・ま` for kanji `{literal:"間", on:["カン","ケン"], kun:["あいだ","ま"]}`, and `음독 カン` when `kun` is empty.
- [ ] **Step 2: Write failing tests** in `grade.test.ts`: `isCorrect("間","間")`, `isCorrect(" 間 ","間")`, `isCorrect("　間","間")`, `isCorrect("間違","間")` are true. `isCorrect("かん","間")`, `isCorrect("","間")` are false. `normalizeAnswer("𠮷野") === "𠮷"` (surrogate pair).
- [ ] **Step 3:** Run `pnpm test` → the new tests FAIL.
- [ ] **Step 4:** Implement `wadou.ts` and `grade.ts`.
- [ ] **Step 5:** Run `pnpm test` → all PASS.
- [ ] **Step 6:** Commit with `feat: wadou puzzle generator and answer grading`.

### Task 4: Word cache and API route

**Files:**
- Create: `lib/practice/word-cache.ts`
- Create: `app/api/practice/wadou/route.ts`

**Interfaces:**
- Consumes: `buildWadouIndex`, `generateWadou`, `WadouPuzzle` (Task 3). Models `PracticeWord`, `PracticeKanji` (Task 2). `connectToDatabase` from `@/lib/db`.
- Produces:
  - `getWadouIndex(): Promise<WadouIndex | null>` in `word-cache.ts`. It returns `null` when there are no non-disabled words. It caches the index plus a load timestamp in a module variable, reloads after 1 h, and shares one in-flight promise across concurrent callers. A failed load is not cached.
  - `GET /api/practice/wadou` → `200 WadouPuzzle`. `503 { error: "no puzzles" }` when the index is null or the generator returns null. `500 { error }` on exceptions, logged like `app/api/tag/route.ts`. All responses set `Cache-Control: no-store`.

- [ ] **Step 1:** Implement `word-cache.ts`. Use `.lean()` queries with `disabled: { $ne: true }` and projections limited to the `PracticeWordData` / `KanjiReadings` fields.
- [ ] **Step 2:** Implement the route with `Math.random` as rng.
- [ ] **Step 3:** With `pnpm dev`, `curl -s -D- 'localhost:3000/api/practice/wadou'` → 200, `cache-control: no-store`, a JSON body under 1.5 KB (`| wc -c`). A second call is fast (no DB query; check with a temporary `console.time` that you remove afterwards).
- [ ] **Step 4:** `pnpm lint` passes. Commit with `feat: practice wadou API with in-memory word cache`.

### Task 5: Practice pages and navigation

**Files:**
- Modify: `components/layout/bottom-nav.tsx` (add `{ label: "연습", href: "/practice", icon: Puzzle }` between 검색 and 참고)
- Create: `app/practice/page.tsx` (type list)
- Create: `app/practice/wadou/page.tsx` (server wrapper with `MainLayout padded` and metadata title `和同開珎 연습`)
- Create: `components/practice/wadou-client.tsx` (state and fetching)
- Create: `components/practice/wadou-board.tsx` (cross figure)

**Interfaces:**
- Consumes: `WadouPuzzle`, `arrowFor`, `SpokePosition` from `@/lib/practice/wadou`. `isCorrect` from `@/lib/practice/grade`. `GET /api/practice/wadou`.
- Produces: `<WadouBoard puzzle={WadouPuzzle} revealed={boolean} />`. A 3×3 grid: outers in the edge cells, arrows between each outer and the center, and the center shows `?` until `revealed`, then the answer.

Behavior (spec "Page" section):
- `/practice`: heading `문제 연습`, subtitle `나조에 자주 나오는 유형을 직접 풀어 보세요.`, one card in the `/reference` card style. Title `和同開珎`, description `가운데 한 글자로 네 단어 만들기`, linking to `/practice/wadou`.
- Question line: `가운데에 한자 한 글자를 넣어 화살표 방향으로 읽으면 네 단어가 됩니다. 들어갈 한자는?`
- Input with `lang="ja"` and a 확인 button. In the keydown handler, return early when `e.nativeEvent.isComposing` is true. Wrong → shake the input (a CSS keyframe in `globals.css` or a Tailwind arbitrary animation), clear it, keep focus.
- Buttons `힌트` (first shows hints[0], then hints[1], then disables), `선택지 보기` (shows the four choices as buttons; tapping one grades it), `모르겠어요` (reveals).
- On reveal (correct or 모르겠어요): `revealed` = true. Show a result line, `정답!` or `정답은 間`. Then list the four words with `<ruby>` per segment and the meaning. Show the `다음 문제` button.
- Fetching: use an `AbortController`: a new fetch aborts the previous one, and an aborted fetch never sets state. Show a skeleton while loading. On a non-OK response or a network error, show `문제를 불러오지 못했어요` and a `다시 시도` button.

- [ ] **Step 1:** Add the nav item and `/practice` page.
- [ ] **Step 2:** Build `WadouBoard`, then `WadouClient` and the page.
- [ ] **Step 3:** `pnpm lint` and `pnpm build` pass.
- [ ] **Step 4:** Manual check in the running app at 390 px width, light and dark:
  - Solve one by typing with the Japanese IME. Enter during conversion must not submit.
  - Solve one via 선택지 보기.
  - Use both hints, then 모르겠어요.
  - Tap 다음 문제 rapidly 5 times; one puzzle ends up shown, with no flicker of older ones.
  - Stop Mongo access (point `MONGODB_URI` at an empty DB), see the error state, and check that retry works after restoring it.
  - The 연습 tab is highlighted on `/practice` and `/practice/wadou`.
- [ ] **Step 5:** Commit with `feat: 和同開珎 practice page`.
