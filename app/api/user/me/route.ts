import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/user";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).user.id;
    await connectToDatabase();

    let user = await User.findOne({ userId });

    if (!user) {
      // If no user in DB, create one with a default random nickname
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
      const defaultNickname = `나조탐험가_${randomSuffix}`;

      user = await User.create({
        userId,
        nickname: defaultNickname,
        email: (session as any).user.email,
        image: (session as any).user.image,
      });

      return NextResponse.json(user, { status: 201 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch or create user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).user.id;
    const body = await req.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0) {
      return NextResponse.json({ error: "Invalid nickname" }, { status: 400 });
    }

    await connectToDatabase();

    // Upsert user
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          nickname: nickname.trim(),
          email: (session as any).user.email,
          image: (session as any).user.image,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
