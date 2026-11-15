import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Nazo from "@/models/nazo";
import "@/models/creator";
import "@/models/tag";
import { authOptions } from "@/lib/auth";
import { andAll, nazoListConditions, nazoSort } from "@/lib/nazo-query";
import { isObjectIdHex } from "@/lib/image-key";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const sort = nazoSort(searchParams.get("sort"));

    const filter = andAll({}, await nazoListConditions(searchParams));

    const nazos = await Nazo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("creators", "name")
      .populate("tags", "name")
      .lean();

    const total = await Nazo.countDocuments(filter);

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
    // A client-supplied _id is allowed only as the id reserved by /api/upload for this nazo's image.
    if (body._id !== undefined && !isObjectIdHex(body._id)) {
      return NextResponse.json({ error: "Invalid nazo id" }, { status: 400 });
    }
    await dbConnect();

    const nazo = await Nazo.create(body);

    return NextResponse.json(nazo, { status: 201 });
  } catch (error) {
    console.error("Failed to create nazo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
