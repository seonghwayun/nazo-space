import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Rate from "@/models/rate";
import Nazo from "@/models/nazo";
import { authOptions } from "@/lib/auth";

async function updateNazoStatsIncremental(nazoId: string, rateDiff: number, countDiff: number) {
  // Atomic update using Aggregation Pipeline (MongoDB 4.2+)
  // This ensures that inc and average calculation happen in the same operation, preventing race conditions.
  // Using native collection to avoid Mongoose validation error regarding pipeline arrays

  await Nazo.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(nazoId) },
    [
      {
        $set: {
          totalRate: { $add: [{ $ifNull: ["$totalRate", 0] }, rateDiff] },
          rateCount: { $add: [{ $ifNull: ["$rateCount", 0] }, countDiff] },
        },
      },
      {
        $set: {
          averageRate: {
            $cond: {
              if: { $gt: ["$rateCount", 0] },
              then: { $divide: ["$totalRate", "$rateCount"] },
              else: 0,
            },
          },
        },
      },
    ]
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nazoId } = await params;
    await connectToDatabase();

    const rate = await Rate.findOne({
      userId: (session as any).user.id,
      nazoId: nazoId,
    });

    return NextResponse.json(rate || { rate: 0 });
  } catch (error) {
    console.error("Error fetching rate:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nazoId } = await params;
    const body = await req.json();
    const { rate } = body;
    const userId = (session as any).user.id;

    // Safety check for rate value
    if (typeof rate !== 'number') {
      return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check existing rate to calculate diff
    const existingRateDoc = await Rate.findOne({ userId, nazoId });
    const oldRate = existingRateDoc ? existingRateDoc.rate : 0;
    const isNew = !existingRateDoc;

    // If rate hasn't changed, no need to do heavy updates, but we might want to ensure Record exists.
    if (!isNew && oldRate === rate) {
      return NextResponse.json(existingRateDoc);
    }

    // 2. Update/Create Rate
    const updatedRate = await Rate.findOneAndUpdate(
      { userId, nazoId },
      { $set: { rate, userId, nazoId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. Incremental Update on Nazo
    const rateDiff = rate - oldRate;
    const countDiff = isNew ? 1 : 0;

    await updateNazoStatsIncremental(nazoId, rateDiff, countDiff);

    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error("Error updating rate:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nazoId } = await params;
    const userId = (session as any).user.id;
    await connectToDatabase();

    // 1. Get existing rate to know what to subtract
    const existingRateDoc = await Rate.findOne({ userId, nazoId });
    if (!existingRateDoc) {
      return NextResponse.json({ success: true, message: "No rating to delete" });
    }

    const oldRate = existingRateDoc.rate;

    // 2. Delete
    await Rate.deleteOne({ userId, nazoId });

    // 3. Incremental Update (Subtract)
    await updateNazoStatsIncremental(nazoId, -oldRate, -1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rate:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
