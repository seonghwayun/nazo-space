import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Creator from "@/models/creator";
import { escapeRegex, mergeExactFirst } from "@/lib/search-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    await dbConnect();

    const pattern = escapeRegex(query.trim());
    const [exact, creators] = await Promise.all([
      Creator.findOne({ name: { $regex: `^${pattern}$`, $options: "i" } }).select("_id name url"),
      Creator.find({ name: { $regex: pattern, $options: "i" } })
        .limit(10)
        .select("_id name url"),
    ]);

    return NextResponse.json({ results: mergeExactFirst(exact, creators) });
  } catch (error) {
    console.error("Failed to search creators:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
