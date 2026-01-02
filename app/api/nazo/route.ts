import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Nazo from "@/models/nazo";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const nazo = await Nazo.create(body);

    return NextResponse.json(nazo, { status: 201 });
  } catch (error) {
    console.error("Failed to create nazo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
