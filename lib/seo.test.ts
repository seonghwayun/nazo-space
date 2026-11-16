import { test } from "node:test";
import assert from "node:assert/strict";
import { listDescription, nazoDescription, nazoTitle, shareMeta, truncate } from "./seo.ts";

test("truncate leaves short text alone and cuts long text on a word with an ellipsis", () => {
  assert.equal(truncate("짧은  설명\n입니다"), "짧은 설명 입니다");
  const long = "단어 ".repeat(100);
  const cut = truncate(long, 50);
  assert.ok(cut.length <= 50, cut);
  assert.ok(cut.endsWith("단어…"), cut);
});

test("nazoTitle adds the Korean title only when it differs", () => {
  assert.equal(nazoTitle({ originalTitle: "謎の館", translatedTitle: "수수께끼의 저택" }), "謎の館 (수수께끼의 저택) - 나조토키");
  assert.equal(nazoTitle({ originalTitle: "謎の館", translatedTitle: "謎の館" }), "謎の館 - 나조토키");
  assert.equal(nazoTitle({ originalTitle: "謎の館", translatedTitle: "  " }), "謎の館 - 나조토키");
});

test("nazoDescription is specific to the nazo even without a description", () => {
  const d = nazoDescription({
    originalTitle: "謎の館",
    translatedTitle: "수수께끼의 저택",
    creators: [{ name: "SCRAP" }],
    tags: [{ name: "Mystery for You" }],
    averageRate: 4.25,
    rateCount: 12,
    difficulty: "보통",
  });
  assert.equal(
    d,
    "「謎の館 (수수께끼의 저택)」 SCRAP 제작 나조토키 · 평균 ★4.3 (12명) · 난이도 보통 · #Mystery for You. 후기와 평점, 플레이 기록을 Nazo Space에서 확인하세요."
  );
});

test("nazoDescription leaves out an empty rating and keeps within the limit", () => {
  const d = nazoDescription({ originalTitle: "X", rateCount: 0, averageRate: 0, description: "가".repeat(400) });
  assert.ok(!d.includes("★"), d);
  assert.ok(d.startsWith("「X」 나조토키."), d);
  assert.ok(d.length <= 155 && d.endsWith("…"), d);
});

test("listDescription names a few nazos and the total", () => {
  assert.equal(
    listDescription("tag", "방탈출", ["A", "B", "C", "D"]),
    "#방탈출 태그의 나조토키 「A」, 「B」, 「C」 등 4개. 후기와 평점, 플레이 기록을 Nazo Space에서 확인하세요."
  );
  assert.match(listDescription("creator", "SCRAP", []), /^SCRAP에서 제작한 나조토키 모음/);
});

test("shareMeta repeats site fields, falls back to the default image, and uses the small card for posters", () => {
  const plain = shareMeta({ title: "T", description: "D", path: "/tag/1" });
  assert.equal(plain.openGraph.siteName, "Nazo Space");
  assert.equal(plain.openGraph.title, "T | Nazo Space");
  assert.deepEqual(plain.openGraph.images, ["/opengraph-image"]);
  assert.equal(plain.twitter.card, "summary_large_image");
  assert.equal(shareMeta({ title: "T", description: "D", path: "/", image: "https://x/p.jpg", poster: true }).twitter.card, "summary");
});
