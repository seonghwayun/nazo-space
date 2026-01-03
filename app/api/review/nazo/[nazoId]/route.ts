import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/db";
import Review from "@/models/review";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const review = await Review.findOne({
      userId: (session as any).user.id,
      nazoId: nazoId,
    });

    return NextResponse.json(review || null);
  } catch (error) {
    console.error("Error fetching review:", error);
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
    const { review, memo } = body;
    const userId = (session as any).user.id;

    await connectToDatabase();

    const updatedReview = await Review.findOneAndUpdate(
      { userId, nazoId },
      { $set: { review, memo, userId, nazoId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
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

    // Just delete the review document
    await Review.deleteOne({ userId, nazoId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
