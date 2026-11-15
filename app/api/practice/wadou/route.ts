import { NextResponse } from "next/server";
import { getWadouIndex } from "@/lib/practice/word-cache";
import { generateWadou } from "@/lib/practice/wadou";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const index = await getWadouIndex();
    const puzzle = index && generateWadou(index, Math.random);
    if (!puzzle) {
      return NextResponse.json({ error: "no puzzles" }, { status: 503, headers: NO_STORE });
    }
    return NextResponse.json(puzzle, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to generate a wadou puzzle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: NO_STORE });
  }
}
