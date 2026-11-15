import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTitle,
  normalizeName,
  splitMakers,
  resolveCreators,
  parseSheet,
  planImport,
} from "./nazoma-import.ts";

test("normalizeTitle folds width, case and whitespace", () => {
  assert.equal(normalizeTitle(" ＵＮＫＮＯＸ ：RED "), "unknox:red");
  assert.equal(normalizeTitle("深海の城 タイタン（キット版）"), "深海の城タイタン(キット版)");
});

test("normalizeName also ignores underscores and hyphens", () => {
  assert.equal(normalizeName("4CE Dimension"), normalizeName("4CE_Dimension"));
  assert.equal(normalizeName("AnotherVision"), normalizeName("Another Vision"));
});

test("splitMakers splits collaborations on & ＆ ＋ +", () => {
  assert.deepEqual(splitMakers("立川茜＆なぞる", {}), ["立川茜", "なぞる"]);
  assert.deepEqual(splitMakers("MOT!&pintoLab&なぞねこ", {}), ["MOT!", "pintoLab", "なぞねこ"]);
  assert.deepEqual(splitMakers("チャンズファクトリー＋うーベー", {}), ["チャンズファクトリー", "うーベー"]);
  assert.deepEqual(splitMakers("みかん箱&Toy×ボーズ&エレメンツ", {}), ["みかん箱", "Toy×ボーズ", "エレメンツ"]);
  assert.deepEqual(splitMakers("NAZO×NAZO劇団", {}), ["NAZO×NAZO劇団"]);
});

test("splitMakers does not split inside parentheses", () => {
  assert.deepEqual(splitMakers("ファーニャー（Far&Near）", {}), ["ファーニャー（Far&Near）"]);
  assert.deepEqual(splitMakers("A(x&y)&B", {}), ["A(x&y)", "B"]);
});

test("splitMakers uses the override mapping when present", () => {
  const overrides = { "タンブルウィード": ["Tumbleweed"], "祝井ゆん/NEPPA": ["祝井ゆん", "NEPPA"] };
  assert.deepEqual(splitMakers("タンブルウィード", overrides), ["Tumbleweed"]);
  assert.deepEqual(splitMakers("祝井ゆん/NEPPA", overrides), ["祝井ゆん", "NEPPA"]);
});

test("resolveCreators links existing creators by normalized name and dedupes new ones", () => {
  const existing = [{ id: "c1", name: "Another Vision" }, { id: "c2", name: "立川茜" }];
  const resolved = resolveCreators(["AnotherVision", "なぞる", "立川茜", "なぞる "], existing);
  assert.deepEqual(resolved, [
    { name: "Another Vision", existingId: "c1" },
    { name: "なぞる" },
    { name: "立川茜", existingId: "c2" },
  ]);
});

test("parseSheet reads shared strings, inline numbers and entities", () => {
  const shared =
    '<sst><si><t>부스</t></si><si><t>제목</t></si><si><t>A &amp; B</t></si><si><r><t>10</t></r><r><t>0분~</t></r></si></sst>';
  const sheet =
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
    '<row r="2"><c r="A2"><v>12</v></c><c r="B2" t="s"><v>2</v></c><c r="M2" t="s"><v>3</v></c></row>' +
    '</sheetData></worksheet>';
  assert.deepEqual(parseSheet(shared, sheet), [
    { A: "부스", B: "제목" },
    { A: "12", B: "A & B", M: "100분~" },
  ]);
});

test("planImport keeps exact matches, skips DB titles and reports unmatched", () => {
  const rows: Record<string, string>[] = [
    { B: "UNKNOX:RED", C: "Machihack!", M: "100분~" },
    { B: "UNKNOX：RED", C: "Machihack!" }, // duplicate row
    { B: "既存の謎", C: "X" },
    { B: "めるくめる謎", C: "Y" },
  ];
  const items = [
    { title: "UNKNOX:RED", maker: "Machihack!", imageUrl: "uploads/a.jpg" },
    { title: "既存の謎", maker: "X", imageUrl: "" },
    { title: "めくるめく謎", maker: "Y", imageUrl: "uploads/b.jpg" },
  ];
  const plan = planImport(rows, items, ["既存の謎"]);
  assert.deepEqual(plan.toImport, [
    { title: "UNKNOX:RED", maker: "Machihack!", imageUrl: "uploads/a.jpg", estimatedTime: "100분~" },
  ]);
  assert.deepEqual(plan.alreadyInDb, ["既存の謎"]);
  assert.deepEqual(plan.unmatched, [{ title: "めるくめる謎", seller: "Y", closest: "めくるめく謎" }]);
});

test("planImport follows title aliases for sheet typos", () => {
  const rows = [{ B: "めるくめる謎", C: "Y", M: "60분" }];
  const items = [{ title: "めくるめく謎", maker: "Y", imageUrl: "uploads/b.jpg" }];
  const plan = planImport(rows, items, [], { titleAliases: { "めるくめる謎": "めくるめく謎" } });
  assert.deepEqual(plan.toImport, [
    { title: "めくるめく謎", maker: "Y", imageUrl: "uploads/b.jpg", estimatedTime: "60분" },
  ]);
  assert.deepEqual(plan.unmatched, []);
});

test("planImport drops excluded titles (e.g. bundle sets)", () => {
  const rows = [{ B: "TEA4PARTYコンプリートセット", C: "Z" }, { B: "CAELUM", C: "Z" }];
  const items = [
    { title: "TEA4PARTYコンプリートセット", maker: "Z", imageUrl: "uploads/s.jpg" },
    { title: "CAELUM", maker: "Z", imageUrl: "uploads/c.jpg" },
  ];
  const plan = planImport(rows, items, [], { excludeTitles: ["TEA4PARTYコンプリートセット"] });
  assert.deepEqual(plan.toImport.map((c) => c.title), ["CAELUM"]);
  assert.deepEqual(plan.excluded, ["TEA4PARTYコンプリートセット"]);
});

test("planImport imports manual titles from the sheet when the catalog lacks them", () => {
  const rows: Record<string, string>[] = [{ B: "透明人間", C: "あき03Xteaparty", M: "30분" }, { B: "旨", C: "あき03Xteaparty" }];
  const plan = planImport(rows, [], [], { manualTitles: ["透明人間"] });
  assert.deepEqual(plan.toImport, [
    { title: "透明人間", maker: "あき03Xteaparty", imageUrl: "", estimatedTime: "30분" },
  ]);
  assert.deepEqual(plan.unmatched.map((u) => u.title), ["旨"]);
});

test("planImport excludes sheet titles even when the catalog lacks them", () => {
  const plan = planImport([{ B: "あああああ(4개세트)", C: "Z" }], [], [], { excludeTitles: ["あああああ(4개세트)"] });
  assert.deepEqual(plan.excluded, ["あああああ(4개세트)"]);
  assert.deepEqual(plan.unmatched, []);
});

test("planImport expands a set into catalog items, falling back to the set's maker and image", () => {
  const rows: Record<string, string>[] = [{ B: "おにぎり謎 3種セット", C: "おにラビ", M: "30분" }, { B: "おにぎり謎 さけ", C: "おにラビ" }];
  const items = [
    { title: "おにぎり謎 3種セット", maker: "O", imageUrl: "uploads/set.jpg" },
    { title: "おにぎり謎 さけ", maker: "O", imageUrl: "uploads/sake.jpg" },
    { title: "おにぎり謎 うめ", maker: "O", imageUrl: "uploads/ume.jpg" },
  ];
  const plan = planImport(rows, items, [], {
    expand: { "おにぎり謎 3種セット": ["おにぎり謎 さけ", "おにぎり謎 うめ", "おにぎり謎 こんぶ"] },
  });
  assert.deepEqual(plan.toImport, [
    { title: "おにぎり謎 さけ", maker: "O", imageUrl: "uploads/sake.jpg" },
    { title: "おにぎり謎 うめ", maker: "O", imageUrl: "uploads/ume.jpg" },
    { title: "おにぎり謎 こんぶ", maker: "O", imageUrl: "uploads/set.jpg" },
  ]);
  assert.deepEqual(plan.unmatched, []);
});
