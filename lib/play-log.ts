// Pure helpers (no imports) so they can be unit-tested with `node --test`.
//
// A "play log" is one user's record of one nazo. It lives in the Review
// collection (plus the user's Rate, kept separately for the nazo's average).
// Status is just played / not played yet:
//   - "played":   the user did it. Records saved before statuses existed have no
//                 status and count as played.
//   - "unplayed": the user has it (bought / saved) but hasn't played it yet.

export type PlayStatus = "played" | "unplayed";

export function normalizeStatus(status: unknown): PlayStatus {
  return status === "unplayed" ? "unplayed" : "played";
}

export interface PlayLogInput {
  status: PlayStatus;
  playedAt: string | null; // YYYY-MM-DD
  durationMinutes: number | null;
  companions: string;
  review: string;
  hasSpoiler: boolean;
  memo: string;
  rate: number | null; // 0.5 – 5 in 0.5 steps
}

export const LIMITS = {
  review: 5000,
  memo: 5000,
  companions: 50,
  durationMinutes: 24 * 60 * 7,
};

type ParseResult = { ok: true; value: PlayLogInput } | { ok: false; error: string };

function optionalInt(v: unknown, max: number, label: string): number | null | string {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > max) {
    return `${label} 값이 올바르지 않습니다.`;
  }
  return v;
}

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Validates a request body for saving a play log. Unplayed logs keep only the memo. */
export function parsePlayLogInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "잘못된 요청입니다." };
  const b = body as Record<string, unknown>;

  if (b.status !== "played" && b.status !== "unplayed") {
    return { ok: false, error: "상태가 올바르지 않습니다." };
  }
  const status = b.status;
  const memo = text(b.memo, LIMITS.memo);

  if (status === "unplayed") {
    return {
      ok: true,
      value: {
        status, memo,
        playedAt: null, durationMinutes: null,
        companions: "", review: "", hasSpoiler: false, rate: null,
      },
    };
  }

  let playedAt: string | null = null;
  if (b.playedAt !== null && b.playedAt !== undefined && b.playedAt !== "") {
    if (typeof b.playedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.playedAt) || isNaN(Date.parse(b.playedAt))) {
      return { ok: false, error: "플레이 날짜가 올바르지 않습니다." };
    }
    playedAt = b.playedAt;
  }

  const durationMinutes = optionalInt(b.durationMinutes, LIMITS.durationMinutes, "걸린 시간");
  if (typeof durationMinutes === "string") return { ok: false, error: durationMinutes };

  let rate: number | null = null;
  if (b.rate !== null && b.rate !== undefined && b.rate !== 0) {
    if (typeof b.rate !== "number" || b.rate < 0.5 || b.rate > 5 || (b.rate * 2) % 1 !== 0) {
      return { ok: false, error: "별점이 올바르지 않습니다." };
    }
    rate = b.rate;
  }

  const review = text(b.review, LIMITS.review);
  return {
    ok: true,
    value: {
      status, playedAt, durationMinutes, rate, review, memo,
      companions: text(b.companions, LIMITS.companions),
      hasSpoiler: review !== "" && b.hasSpoiler === true,
    },
  };
}

// ---------- dates ----------

/**
 * playedAt is saved from a YYYY-MM-DD input as UTC midnight, so read it back
 * with UTC getters to get the same calendar day in every time zone.
 */
export function playedDateKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** A local calendar day (e.g. "today" or a createdAt timestamp) as YYYY-MM-DD. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(toKey) - Date.parse(fromKey)) / 86400000);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

// ---------- stats ----------

export interface LogEntry {
  nazoId: string;
  status: PlayStatus;
  /** Day the user played it; falls back to the day the record was made. */
  dayKey: string;
  durationMinutes?: number | null;
  rate?: number | null;
  creators?: string[];
}

export interface PlayStats {
  playedCount: number;
  unplayedCount: number;
  totalMinutes: number;
  /** Oldest → newest, `months` entries ending at the month of `todayKey`. */
  monthly: { month: string; count: number }[];
  topCreators: { name: string; count: number }[];
  ratedCount: number;
  averageRate: number | null;
  /** 0.5 → 5.0 in 0.5 steps (10 buckets). */
  rateDistribution: { rate: number; count: number }[];
  /** The rating given most often (higher wins a tie), or null with no ratings. */
  mostGivenRate: number | null;
}

export function monthKeys(todayKey: string, months: number): string[] {
  let y = Number(todayKey.slice(0, 4));
  let m = Number(todayKey.slice(5, 7));
  const keys: string[] = [];
  for (let i = 0; i < months; i++) {
    keys.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  return keys;
}

export function computeStats(entries: LogEntry[], todayKey: string, months = 6): PlayStats {
  const played = entries.filter((e) => e.status === "played");
  const keys = monthKeys(todayKey, months);
  const perMonth = new Map(keys.map((k) => [k, 0]));
  const perCreator = new Map<string, number>();

  for (const e of played) {
    const mk = e.dayKey.slice(0, 7);
    if (perMonth.has(mk)) perMonth.set(mk, perMonth.get(mk)! + 1);
    for (const c of e.creators ?? []) perCreator.set(c, (perCreator.get(c) ?? 0) + 1);
  }

  const rates = played.map((e) => e.rate).filter((r): r is number => typeof r === "number" && r > 0);
  const rateDistribution = Array.from({ length: 10 }, (_, i) => {
    const rate = (i + 1) / 2;
    return { rate, count: rates.filter((r) => r === rate).length };
  });
  const most = rateDistribution.reduce<{ rate: number; count: number } | null>(
    (a, b) => (b.count > 0 && (!a || b.count >= a.count) ? b : a),
    null
  );

  return {
    playedCount: played.length,
    unplayedCount: entries.length - played.length,
    totalMinutes: played.reduce((a, e) => a + (e.durationMinutes ?? 0), 0),
    monthly: keys.map((k) => ({ month: k, count: perMonth.get(k)! })),
    topCreators: [...perCreator.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    ratedCount: rates.length,
    averageRate: rates.length ? rates.reduce((a, r) => a + r, 0) / rates.length : null,
    rateDistribution,
    mostGivenRate: most?.rate ?? null,
  };
}

/** Played entries of one month, grouped by day of month (1–31), newest first within a day. */
export function groupByDay<T extends LogEntry>(entries: T[], monthKey: string): Map<number, T[]> {
  const out = new Map<number, T[]>();
  for (const e of entries) {
    if (e.status !== "played" || e.dayKey.slice(0, 7) !== monthKey) continue;
    const day = Number(e.dayKey.slice(8, 10));
    if (!out.has(day)) out.set(day, []);
    out.get(day)!.push(e);
  }
  return out;
}

/** Calendar cells for a month: leading nulls for the weekday offset (Sunday first), then 1..N. */
export function monthGrid(monthKey: string): (number | null)[] {
  const y = Number(monthKey.slice(0, 4));
  const m = Number(monthKey.slice(5, 7));
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export function shiftMonth(monthKey: string, delta: number): string {
  const y = Number(monthKey.slice(0, 4));
  const m = Number(monthKey.slice(5, 7)) - 1 + delta;
  const ny = y + Math.floor(m / 12);
  const nm = ((m % 12) + 12) % 12;
  return `${ny}-${String(nm + 1).padStart(2, "0")}`;
}
