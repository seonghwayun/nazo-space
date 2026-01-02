import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Creator from "@/models/creator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    await dbConnect();

    const creators = await Creator.find({
      name: { $regex: query, $options: "i" },
    })
      .limit(10)
      .select("_id name url");

    return NextResponse.json({ results: creators });
  } catch (error) {
    console.error("Failed to search creators:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
