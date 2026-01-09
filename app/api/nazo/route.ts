import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Nazo from "@/models/nazo";
import "@/models/creator";
import "@/models/tag";
import { authOptions } from "@/lib/auth";


export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const nazos = await Nazo.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creators", "name")
      .populate("tags", "name")
      .lean();

    const total = await Nazo.countDocuments();

    return NextResponse.json({
      data: nazos,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: skip + nazos.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch nazos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    delete body.createdAt;
    delete body.updatedAt;
    await dbConnect();

    const nazo = await Nazo.create(body);

    return NextResponse.json(nazo, { status: 201 });
  } catch (error) {
    console.error("Failed to create nazo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
