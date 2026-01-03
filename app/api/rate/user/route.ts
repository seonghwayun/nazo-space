import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/db";
import Rate from "@/models/rate";
import Nazo from "@/models/nazo";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const userId = (session as any).user.id;
    await connectToDatabase();

    // 1. Find user's rates
    const rates = await Rate.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!rates.length) {
      return NextResponse.json({ results: [], hasMore: false });
    }

    // 2. Fetch corresponding Nazos
    const nazoIds = rates.map((r) => r.nazoId);
    const nazos = await Nazo.find({ _id: { $in: nazoIds } }).lean();

    // 3. Map Nazo to Rate (to preserve sort order and structure)
    // Create a map for quick lookup
    const nazosMap = new Map(nazos.map((n: any) => [n._id.toString(), n]));

    const results = rates.map((r) => {
      const nazo = nazosMap.get(r.nazoId.toString());
      if (!nazo) return null;
      return {
        nazo,
        myRate: r.rate,
        ratedAt: r.updatedAt,
      };
    }).filter(item => item !== null);

    // Check if there are more items
    const totalCount = await Rate.countDocuments({ userId });
    const hasMore = totalCount > skip + limit;

    return NextResponse.json({ results, hasMore });
  } catch (error) {
    console.error("Failed to fetch user rates:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
