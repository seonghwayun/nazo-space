import { NextResponse } from "next/server";
import { getHomeData } from "@/lib/home-data";

export async function GET() {
  try {
    return NextResponse.json(await getHomeData(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
