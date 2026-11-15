import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeStatus,
  parsePlayLogInput,
  playedDateKey,
  daysBetween,
  formatDuration,
  computeStats,
  groupByDay,
  monthGrid,
  monthKeys,
  shiftMonth,
  type LogEntry,
} from "./play-log.ts";

test("records without a status count as played", () => {
  assert.equal(normalizeStatus(undefined), "played");
  assert.equal(normalizeStatus("played"), "played");
  assert.equal(normalizeStatus("unplayed"), "unplayed");
  assert.equal(normalizeStatus("retired"), "played");
});

test("a played log keeps its fields", () => {
  const r = parsePlayLogInput({
    status: "played", playedAt: "2026-11-09", durationMinutes: 150,
    companions: "  친구 2명 ", review: " 좋았어요 ", hasSpoiler: true, memo: "답: 시계", rate: 4.5,
  });
  assert.deepEqual(r, {
    ok: true,
    value: {
      status: "played", playedAt: "2026-11-09", durationMinutes: 150,
      companions: "친구 2명", review: "좋았어요", hasSpoiler: true, memo: "답: 시계", rate: 4.5,
    },
  });
});

test("an unplayed log drops everything but the memo", () => {
  const r = parsePlayLogInput({ status: "unplayed", review: "x", rate: 4, playedAt: "2026-01-01", memo: "사 둠" });
  assert.ok(r.ok);
  assert.equal(r.value.rate, null);
  assert.equal(r.value.review, "");
  assert.equal(r.value.playedAt, null);
  assert.equal(r.value.memo, "사 둠");
});

test("the spoiler flag needs a review", () => {
  const r = parsePlayLogInput({ status: "played", review: "", hasSpoiler: true });
  assert.ok(r.ok);
  assert.equal(r.value.hasSpoiler, false);
});

test("invalid input is rejected", () => {
  assert.equal(parsePlayLogInput({ status: "retired" }).ok, false);
  assert.equal(parsePlayLogInput({ status: "played", rate: 4.3 }).ok, false);
  assert.equal(parsePlayLogInput({ status: "played", rate: 6 }).ok, false);
  assert.equal(parsePlayLogInput({ status: "played", durationMinutes: -1 }).ok, false);
  assert.equal(parsePlayLogInput({ status: "played", durationMinutes: 1.5 }).ok, false);
  assert.equal(parsePlayLogInput({ status: "played", playedAt: "11/09/2026" }).ok, false);
  assert.equal(parsePlayLogInput(null).ok, false);
});

test("rate 0 means no rating", () => {
  const r = parsePlayLogInput({ status: "played", rate: 0 });
  assert.ok(r.ok);
  assert.equal(r.value.rate, null);
});

test("playedAt saved as UTC midnight keeps its calendar day", () => {
  assert.equal(playedDateKey(new Date("2026-11-09")), "2026-11-09");
  assert.equal(playedDateKey("2026-11-09T00:00:00.000Z"), "2026-11-09");
});

test("date and duration helpers", () => {
  assert.equal(daysBetween("2026-11-01", "2026-11-15"), 14);
  assert.equal(formatDuration(150), "2시간 30분");
  assert.equal(formatDuration(120), "2시간");
  assert.equal(formatDuration(45), "45분");
  assert.equal(formatDuration(null), "");
});

test("month helpers", () => {
  assert.deepEqual(monthKeys("2026-02-10", 3), ["2025-12", "2026-01", "2026-02"]);
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  // November 2026 starts on a Sunday.
  const nov = monthGrid("2026-11");
  assert.equal(nov[0], 1);
  assert.equal(nov.length, 30);
  const oct = monthGrid("2026-10"); // starts on Thursday
  assert.deepEqual(oct.slice(0, 5), [null, null, null, null, 1]);
});

const entries: LogEntry[] = [
  { nazoId: "a", status: "played", dayKey: "2026-11-09", durationMinutes: 150, creators: ["謎屋"] },
  { nazoId: "b", status: "played", dayKey: "2026-11-09", durationMinutes: 30, creators: ["謎屋", "Riddle"] },
  { nazoId: "c", status: "played", dayKey: "2026-10-02", creators: ["Riddle"] },
  { nazoId: "d", status: "played", dayKey: "2025-01-01", creators: ["Old"] },
  { nazoId: "e", status: "unplayed", dayKey: "2026-11-01", creators: ["謎屋"] },
];

test("stats count played logs only", () => {
  const s = computeStats(entries, "2026-11-15", 3);
  assert.equal(s.playedCount, 4);
  assert.equal(s.unplayedCount, 1);
  assert.equal(s.totalMinutes, 180);
  assert.deepEqual(s.monthly, [
    { month: "2026-09", count: 0 },
    { month: "2026-10", count: 1 },
    { month: "2026-11", count: 2 },
  ]);
  assert.deepEqual(s.topCreators, [
    { name: "Riddle", count: 2 },
    { name: "謎屋", count: 2 },
    { name: "Old", count: 1 },
  ]);
});

test("rating stats use played, rated logs only", () => {
  const s = computeStats(
    [
      { nazoId: "a", status: "played", dayKey: "2026-11-01", rate: 4 },
      { nazoId: "b", status: "played", dayKey: "2026-11-02", rate: 4 },
      { nazoId: "c", status: "played", dayKey: "2026-11-03", rate: 5 },
      { nazoId: "d", status: "played", dayKey: "2026-11-04", rate: 2.5 },
      { nazoId: "e", status: "played", dayKey: "2026-11-05", rate: 2.5 },
      { nazoId: "f", status: "played", dayKey: "2026-11-06" },
      { nazoId: "g", status: "unplayed", dayKey: "2026-11-07", rate: 1 },
    ],
    "2026-11-15"
  );
  assert.equal(s.ratedCount, 5);
  assert.equal(s.averageRate, 3.6);
  assert.equal(s.rateDistribution.length, 10);
  assert.deepEqual(s.rateDistribution.find((d) => d.rate === 2.5), { rate: 2.5, count: 2 });
  assert.equal(s.rateDistribution.find((d) => d.rate === 1)!.count, 0);
  assert.equal(s.mostGivenRate, 4); // 4 and 2.5 tie at 2: the higher wins
  assert.equal(computeStats([], "2026-11-15").averageRate, null);
  assert.equal(computeStats([], "2026-11-15").mostGivenRate, null);
});

test("groupByDay keeps played logs of the month", () => {
  const g = groupByDay(entries, "2026-11");
  assert.deepEqual([...g.keys()], [9]);
  assert.equal(g.get(9)!.length, 2);
});
