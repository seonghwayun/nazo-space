import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Review from "@/models/review";
import User from "@/models/user";
import Rate from "@/models/rate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nazoId = searchParams.get("nazoId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!nazoId) {
      return NextResponse.json({ error: "nazoId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch Reviews (only played logs with review text; memo-only and unplayed logs stay private)
    const filter = { nazoId, review: { $nin: [null, ""] }, status: { $ne: "unplayed" } };
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!reviews.length) {
      return NextResponse.json({ results: [], hasMore: false });
    }

    // 2. Fetch Users and Rates for these reviews
    const userIds = reviews.map((r) => r.userId);

    const [users, rates] = await Promise.all([
      User.find({ userId: { $in: userIds } }).select("userId nickname image").lean(),
      Rate.find({ nazoId, userId: { $in: userIds } }).select("userId rate").lean()
    ]);

    // 3. Create Maps for efficient lookup
    const usersMap = new Map(users.map((u) => [u.userId, u]));
    const ratesMap = new Map(rates.map((r) => [r.userId, r]));

    // 4. Combine data
    const results = reviews.map((r) => {
      const user = usersMap.get(r.userId);
      const rate = ratesMap.get(r.userId);

      return {
        _id: r._id,
        review: r.review,
        hasSpoiler: r.hasSpoiler ?? false,
        playedAt: r.playedAt,
        createdAt: r.createdAt,
        user: user ? {
          nickname: user.nickname,
          image: user.image
        } : { nickname: "Unknown User", image: null },
        rate: rate ? rate.rate : null
      };
    });

    // 5. Check pagination
    const totalCount = await Review.countDocuments(filter);
    const hasMore = totalCount > skip + limit;

    return NextResponse.json({ results, hasMore, totalCount });

  } catch (error) {
    console.error("Failed to fetch public reviews:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
