import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Nazo from "@/models/nazo";
import Tag from "@/models/tag"; // Ensure Tag model is registered
import Creator from "@/models/creator"; // Ensure Creator model is registered

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    // Ensure Tag model is loaded before population
    // In serverless environments, models might not be compiled yet if this route is hit first
    // Just importing it above is usually enough, but sometimes we need to reference it explicitly or ensure connection.
    if (!Tag) {
      console.log("Tag model loading...");
    }
    if (!Creator) {
      console.log("Creator model loading...");
    }

    const nazo = await Nazo.findById(id).populate("tags").populate("creators");

    if (!nazo) {
      return NextResponse.json({ error: "Nazo not found" }, { status: 404 });
    }

    return NextResponse.json(nazo);
  } catch (error) {
    console.error("Failed to fetch nazo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
