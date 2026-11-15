import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Review from "@/models/review";
import Rate from "@/models/rate";
import { authOptions } from "@/lib/auth";
import { setUserRate } from "@/lib/rate-stats";
import { normalizeStatus, parsePlayLogInput, playedDateKey } from "@/lib/play-log";

/** The signed-in user's play log of one nazo: review + memo + play details + rating. */

interface ReviewFields {
  status?: string;
  playedAt?: Date | null;
  durationMinutes?: number | null;
  companions?: string;
  review?: string;
  hasSpoiler?: boolean;
  memo?: string;
  createdAt?: Date;
}

async function currentUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id;
}

function toLog(review: ReviewFields | null, rate: number | null) {
  if (!review && rate === null) return null;
  return {
    status: normalizeStatus(review?.status),
    playedAt: review?.playedAt ? playedDateKey(review.playedAt) : null,
    durationMinutes: review?.durationMinutes ?? null,
    companions: review?.companions ?? "",
    review: review?.review ?? "",
    hasSpoiler: review?.hasSpoiler ?? false,
    memo: review?.memo ?? "",
    rate,
    createdAt: review?.createdAt ?? null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nazoId } = await params;
    await connectToDatabase();
    const [review, rate] = await Promise.all([
      Review.findOne({ userId, nazoId }).lean<ReviewFields>(),
      Rate.findOne({ userId, nazoId }).select("rate").lean<{ rate: number }>(),
    ]);
    return NextResponse.json(toLog(review, rate ? rate.rate : null));
  } catch (error) {
    console.error("Error fetching play log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nazoId } = await params;
    if (!mongoose.isValidObjectId(nazoId)) {
      return NextResponse.json({ error: "Invalid nazo id" }, { status: 400 });
    }
    const parsed = parsePlayLogInput(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const v = parsed.value;

    await connectToDatabase();
    const review = await Review.findOneAndUpdate(
      { userId, nazoId },
      {
        $set: {
          userId,
          nazoId,
          status: v.status,
          playedAt: v.playedAt ? new Date(v.playedAt) : null,
          durationMinutes: v.durationMinutes,
          companions: v.companions,
          review: v.review,
          hasSpoiler: v.hasSpoiler,
          memo: v.memo,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<ReviewFields>();
    const rate = await setUserRate(userId, nazoId, v.rate);

    return NextResponse.json(toLog(review, rate));
  } catch (error) {
    console.error("Error saving play log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nazoId: string }> }
) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nazoId } = await params;
    await connectToDatabase();
    await Review.deleteOne({ userId, nazoId });
    await setUserRate(userId, nazoId, null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting play log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
