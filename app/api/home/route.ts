import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Review from "@/models/review";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Recently Added (10 most recent)
    const recent = await Nazo.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 2. Top Rated (10 highest averageRate)
    const topRated = await Nazo.find({ rateCount: { $gt: 0 } })
      .sort({ averageRate: -1, rateCount: -1 })
      .limit(10)
      .lean();

    // 3. Recently Reviewed
    // Find unique nazoIds from the most recent reviews
    const recentReviews = await Review.find({ review: { $exists: true, $ne: "" } }) // Only reviews with content
      .sort({ createdAt: -1 })
      .limit(50) // Fetch more to account for duplicates
      .lean();

    // Extract unique Nazo IDs while preserving order
    const uniqueNazoIds = Array.from(new Set(recentReviews.map((r: any) => r.nazoId.toString()))).slice(0, 10);

    // Fetch Nazo details for these IDs (preserving order is tricky with Mongo $in, so map manually)
    const reviewedNazosUnordered = await Nazo.find({ _id: { $in: uniqueNazoIds } }).lean();

    // Reorder to match review order
    const recentlyReviewed = uniqueNazoIds.map(id =>
      reviewedNazosUnordered.find((n: any) => n._id.toString() === id)
    ).filter(n => n !== undefined);


    return NextResponse.json({
      recent,
      topRated,
      recentlyReviewed,
    });
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
