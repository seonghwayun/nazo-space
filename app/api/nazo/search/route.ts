import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";
import { toKanaPattern } from "@/lib/kana";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // 'nazo' | 'creator' | 'tag'
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    if (!query) {
      return NextResponse.json({ nazos: [], creators: [], tags: [] });
    }

    const pattern = toKanaPattern(query);
    const regex = { $regex: pattern, $options: "i" };

    let nazos: any[] = [];
    let creators: any[] = [];
    let tags: any[] = [];

    // Execute queries based on 'type' or all if not specified
    if (type === "creator") {
      creators = await Creator.find({ name: regex })
        .skip(skip)
        .limit(limit)
        .lean();
    } else if (type === "tag") {
      tags = await Tag.find({ name: regex })
        .skip(skip)
        .limit(limit)
        .lean();
    } else if (type === "nazo") {
      nazos = await Nazo.find({
        $or: [
          { originalTitle: regex },
          { translatedTitle: regex },
        ],
      })
        .skip(skip)
        .limit(limit)
        .select("originalTitle translatedTitle imageUrl averageRate rateCount creators tags difficulty estimatedTime")
        .populate("creators", "name")
        .lean();
    } else {
      // Initial Search (No type specified) - Fetch Page 1 for all
      // We ignore 'skip' here usually, effectively page=1, unless we want to support paging all?
      // Let's assume initial search is always Page 1.
      const pLimit = 20;

      [creators, tags, nazos] = await Promise.all([
        Creator.find({ name: regex }).limit(pLimit).lean(),
        Tag.find({ name: regex }).limit(pLimit).lean(),
        Nazo.find({
          $or: [
            { originalTitle: regex },
            { translatedTitle: regex },
          ],
        })
          .limit(pLimit)
          .select("originalTitle translatedTitle imageUrl averageRate rateCount creators tags difficulty estimatedTime")
          .populate("creators", "name")
          .lean(),
      ]);
    }

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
