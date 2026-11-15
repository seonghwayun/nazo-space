import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  getR2Bucket,
  getR2Client,
  getR2PublicUrl,
} from "@/lib/r2";

/**
 * Issues a short-lived presigned PUT URL so the browser can upload
 * an image directly to Cloudflare R2 (admin only).
 *
 * Request:  { contentType: string, size: number }
 * Response: { uploadUrl: string, publicUrl: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contentType?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contentType, size } = body;
  const ext = contentType ? ALLOWED_IMAGE_TYPES[contentType] : undefined;
  if (!contentType || !ext) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Invalid file size (max 10MB)" }, { status: 400 });
  }

  try {
    const key = `nazo/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    // Sign content-type/length so the client can't upload a different type or size.
    // (Cache-Control is sent by the client as an unsigned header.)
    const uploadUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-type", "content-length"]),
    });

    return NextResponse.json({ uploadUrl, publicUrl: getR2PublicUrl(key) });
  } catch (error) {
    console.error("Failed to create upload URL", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
