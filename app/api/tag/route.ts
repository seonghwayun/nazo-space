import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Tag from "@/models/tag";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    await connectToDatabase();

    let filter = {};
    if (query) {
      filter = { name: { $regex: query, $options: "i" } };
    }

    const tags = await Tag.find(filter).limit(50);
    return NextResponse.json({ results: tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }

    const tag = await Tag.create({ name });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
