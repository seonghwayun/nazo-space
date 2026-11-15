import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Nazo from "@/models/nazo";
import Review from "@/models/review";
import Rate from "@/models/rate";

type Condition = Record<string, unknown>;

/** Nazo list orders shared by the browse feed and search (`sort=new|rate|popular`). */
export const NAZO_SORTS: Record<string, Record<string, 1 | -1>> = {
  new: { createdAt: -1 },
  rate: { averageRate: -1, rateCount: -1, createdAt: -1 },
  popular: { rateCount: -1, averageRate: -1, createdAt: -1 },
};

export function nazoSort(value: string | null): Record<string, 1 | -1> {
  return (value && NAZO_SORTS[value]) || NAZO_SORTS.new;
}

/**
 * List filters shared by the browse feed (/api/nazo) and search (/api/nazo/search):
 * - `unplayedOnly=1`: hide nazos the signed-in user played (a played log or a rating)
 * Returned as conditions to `$and` with the caller's own filter.
 */
export async function nazoListConditions(searchParams: URLSearchParams): Promise<Condition[]> {
  const conditions: Condition[] = [];

  if (searchParams.get("unplayedOnly") === "1") {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (userId) {
      const [played, rated] = await Promise.all([
        Review.find({ userId, status: { $ne: "unplayed" } }).distinct("nazoId"),
        Rate.find({ userId }).distinct("nazoId"),
      ]);
      conditions.push({ _id: { $nin: [...new Set([...played, ...rated].map(String))] } });
    }
  }

  return conditions;
}

export function andAll(base: Condition, extra: Condition[]): Condition {
  return extra.length ? { $and: [base, ...extra] } : base;
}

export interface NazoStats {
  nazoCount: number;
  /** Up to three most recent posters. */
  posters: { _id: string; imageUrl?: string }[];
}

interface StatsRow {
  _id: unknown;
  nazoCount: number;
  posters: { _id: unknown; imageUrl?: string }[];
}

/** Adds how many nazos each creator / tag has, plus a few poster thumbnails. */
export async function withNazoStats<T extends { _id: unknown }>(
  field: "creators" | "tags",
  docs: T[]
): Promise<(T & NazoStats)[]> {
  if (docs.length === 0) return [];
  const ids = docs.map((d) => new mongoose.Types.ObjectId(String(d._id)));
  const path = "$" + field;
  const rows = await Nazo.aggregate<StatsRow>([
    { $match: { [field]: { $in: ids } } },
    { $project: { [field]: 1, imageUrl: 1, createdAt: 1 } },
    { $unwind: path },
    { $match: { [field]: { $in: ids } } },
    {
      $group: {
        _id: path,
        nazoCount: { $sum: 1 },
        // Keep only the three newest per group instead of pushing every poster and slicing.
        posters: { $topN: { n: 3, sortBy: { createdAt: -1 }, output: { _id: "$_id", imageUrl: "$imageUrl" } } },
      },
    },
  ]);
  const byId = new Map(rows.map((r) => [String(r._id), r]));
  return docs.map((d) => {
    const r = byId.get(String(d._id));
    return {
      ...d,
      nazoCount: r?.nazoCount ?? 0,
      posters: (r?.posters ?? []).map((p) => ({ _id: String(p._id), imageUrl: p.imageUrl })),
    };
  });
}
