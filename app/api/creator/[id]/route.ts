import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Creator from "@/models/creator";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, url } = body;

    await connectToDatabase();

    const updatedCreator = await Creator.findByIdAndUpdate(
      id,
      { name, url },
      { new: true, runValidators: true }
    );

    if (!updatedCreator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCreator);
  } catch (error) {
    console.error("Failed to update creator", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
