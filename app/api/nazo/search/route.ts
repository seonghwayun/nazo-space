import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Search for originalTitle OR translatedTitle containing the query (case-insensitive)
    const results = await Nazo.find({
      $or: [
        { originalTitle: { $regex: query, $options: "i" } },
        { translatedTitle: { $regex: query, $options: "i" } },
      ],
    })
      .limit(20)
      .lean();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
