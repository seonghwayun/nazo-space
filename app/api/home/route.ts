import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Review from "@/models/review";

export async function GET() {
  try {
    await connectToDatabase();

    const [recent, topRated, recentlyReviewed] = await Promise.all([
      // 1. Recently Added
      Nazo.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // 2. Top Rated
      Nazo.find({ rateCount: { $gt: 0 } })
        .sort({ averageRate: -1, rateCount: -1 })
        .limit(10)
        .lean(),

      // 3. Recently Reviewed (Complex logic wrapped in async)
      (async () => {
        const recentReviews = await Review.find({ review: { $exists: true, $ne: "" } })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        const uniqueNazoIds = Array.from(new Set(recentReviews.map((r: any) => r.nazoId.toString()))).slice(0, 10);
        const reviewedNazosUnordered = await Nazo.find({ _id: { $in: uniqueNazoIds } }).lean();

        return uniqueNazoIds.map(id =>
          reviewedNazosUnordered.find((n: any) => n._id.toString() === id)
        ).filter(n => n !== undefined);
      })()
    ]);

    return NextResponse.json(
      {
        recent,
        topRated,
        recentlyReviewed,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
