import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/db";
import Review from "@/models/review";
import Rate from "@/models/rate";
import Nazo from "@/models/nazo";
import "@/models/creator";
import { authOptions } from "@/lib/auth";
import { localDateKey, normalizeStatus, playedDateKey } from "@/lib/play-log";

interface ReviewRow {
  nazoId: string;
  status?: string;
  playedAt?: Date | null;
  durationMinutes?: number | null;
  review?: string;
  createdAt: Date;
}
interface RateRow { nazoId: string; rate: number; createdAt: Date }
interface NazoRow {
  _id: unknown;
  originalTitle: string;
  translatedTitle?: string;
  imageUrl?: string;
  averageRate?: number;
  rateCount?: number;
  estimatedTime?: string;
  difficulty?: string;
  creators?: { name: string }[];
}
interface LogRow {
  nazoId: string;
  status: "played" | "unplayed";
  playedAt: string | null;
  dayKey: string;
  createdAt: Date;
  durationMinutes: number | null;
  hasReview: boolean;
  rate: number | null;
}

/**
 * Every play log of the signed-in user, for the diary, stats and the
 * "쌓아둔 나조" list. A rating without a review (saved before play logs
 * existed) is returned as a played log too.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const [reviews, rates] = await Promise.all([
      Review.find({ userId })
        .select("nazoId status playedAt durationMinutes review createdAt")
        .lean<ReviewRow[]>(),
      Rate.find({ userId }).select("nazoId rate createdAt").lean<RateRow[]>(),
    ]);

    const rateByNazo = new Map(rates.map((r) => [String(r.nazoId), r]));
    const byNazo = new Map<string, LogRow>();
    for (const r of reviews) {
      const id = String(r.nazoId);
      const status = normalizeStatus(r.status);
      byNazo.set(id, {
        nazoId: id,
        status,
        playedAt: r.playedAt ? playedDateKey(r.playedAt) : null,
        dayKey: r.playedAt ? playedDateKey(r.playedAt) : localDateKey(new Date(r.createdAt)),
        createdAt: r.createdAt,
        durationMinutes: r.durationMinutes ?? null,
        hasReview: !!r.review,
        rate: status === "played" ? rateByNazo.get(id)?.rate ?? null : null,
      });
    }
    for (const [id, r] of rateByNazo) {
      if (byNazo.has(id)) continue;
      byNazo.set(id, {
        nazoId: id,
        status: "played",
        playedAt: null,
        dayKey: localDateKey(new Date(r.createdAt)),
        createdAt: r.createdAt,
        durationMinutes: null,
        hasReview: false,
        rate: r.rate,
      });
    }

    const nazos = await Nazo.find({ _id: { $in: [...byNazo.keys()] } })
      .select("originalTitle translatedTitle imageUrl averageRate rateCount estimatedTime difficulty creators")
      .populate("creators", "name")
      .lean<NazoRow[]>();
    const nazoById = new Map(nazos.map((n) => [String(n._id), n]));

    const logs = [...byNazo.values()]
      .filter((l) => nazoById.has(l.nazoId))
      .map((l) => {
        const n = nazoById.get(l.nazoId)!;
        return {
          ...l,
          creators: (n.creators ?? []).map((c) => c.name),
          nazo: {
            _id: String(n._id),
            originalTitle: n.originalTitle,
            translatedTitle: n.translatedTitle,
            imageUrl: n.imageUrl,
            averageRate: n.averageRate,
            rateCount: n.rateCount,
            estimatedTime: n.estimatedTime,
            difficulty: n.difficulty,
          },
        };
      })
      .sort((a, b) => (a.dayKey < b.dayKey ? 1 : a.dayKey > b.dayKey ? -1 : 0));

    return NextResponse.json({ logs }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Failed to fetch play logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
