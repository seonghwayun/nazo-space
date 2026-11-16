import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Review from "@/models/review";
import type { INazo } from "@/models/nazo";

export interface HomeData {
  recent: INazo[];
  topRated: INazo[];
  recentlyReviewed: INazo[];
  totalCount: number;
}

/**
 * The home page lists, as plain JSON (ids and dates as strings). Read on the server for the
 * first render, so the nazo links are in the HTML crawlers get, and by /api/home for
 * pull-to-refresh.
 */
export async function getHomeData(): Promise<HomeData> {
  await connectToDatabase();

  const [recent, topRated, recentlyReviewed, totalCount] = await Promise.all([
    // 1. Recently Added
    Nazo.find({}).sort({ createdAt: -1 }).limit(10).lean(),

    // 2. Top Rated
    Nazo.find({ rateCount: { $gt: 0 } }).sort({ averageRate: -1, rateCount: -1 }).limit(10).lean(),

    // 3. Recently Reviewed: the nazos of the latest written reviews, newest first, each once.
    (async () => {
      const recentReviews = await Review.find({ review: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const uniqueNazoIds = Array.from(new Set(recentReviews.map((r) => String(r.nazoId)))).slice(0, 10);
      const reviewedNazosUnordered = await Nazo.find({ _id: { $in: uniqueNazoIds } }).lean();

      return uniqueNazoIds
        .map((id) => reviewedNazosUnordered.find((n) => String(n._id) === id))
        .filter((n) => n !== undefined);
    })(),

    // 4. Total Count
    Nazo.countDocuments({}),
  ]);

  // Same shape the API has always sent: what JSON makes of the lean documents.
  return JSON.parse(JSON.stringify({ recent, topRated, recentlyReviewed, totalCount }));
}
