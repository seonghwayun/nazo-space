import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/db";
import Rate from "@/models/rate";
import { authOptions } from "@/lib/auth";
import { setUserRate } from "@/lib/rate-stats";

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
    const { rate } = await req.json();
    if (typeof rate !== "number") {
      return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
    }

    await connectToDatabase();
    const saved = await setUserRate((session as any).user.id, nazoId, rate);
    return NextResponse.json({ nazoId, rate: saved });
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
    await connectToDatabase();
    await setUserRate((session as any).user.id, nazoId, null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rate:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
