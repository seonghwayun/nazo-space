import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ nazos: [], creators: [], tags: [] });
    }

    const regex = { $regex: query, $options: "i" };

    // 1. Find matching Creators and Tags first
    const [creators, tags] = await Promise.all([
      Creator.find({ name: regex }).limit(20).lean(),
      Tag.find({ name: regex }).limit(20).lean(),
    ]);

    const creatorIds = creators.map((c) => c._id);
    const tagIds = tags.map((t) => t._id);

    // 2. Find Nazos matching Title (original or translated)
    const nazos = await Nazo.find({
      $or: [
        { originalTitle: regex },
        { translatedTitle: regex },
      ],
    })
      .limit(20)
      .populate("creators") // Populate to show names if needed
      .lean();

    return NextResponse.json({
      nazos,
      creators,
      tags,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
