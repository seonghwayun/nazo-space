import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Nazo from "@/models/nazo";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Same-origin proxy for a nazo's image (used by the share card for canvas/color extraction).
 * Only proxies the imageUrl stored on the given nazo — never an arbitrary URL —
 * so it can't be abused as an open proxy / SSRF vector.
 *
 * GET /api/proxy-image?id=<nazoId>
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) {
    return new NextResponse("Invalid id", { status: 400 });
  }

  try {
    await dbConnect();
    const nazo = await Nazo.findById(id).select("imageUrl").lean();
    const imageUrl = nazo?.imageUrl;
    if (!imageUrl) {
      return new NextResponse("No image", { status: 404 });
    }

    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return new NextResponse("Invalid image URL", { status: 422 });
    }
    if (parsed.protocol !== "https:") {
      return new NextResponse("Unsupported image URL", { status: 422 });
    }

    // imageUrl is admin-curated, so following redirects (e.g. CDN hops) is acceptable.
    const response = await fetch(parsed);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim();
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 422 });
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES) {
      return new NextResponse("Image too large", { status: 413 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return new NextResponse("Image too large", { status: 413 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Short-ish cache: the nazo's image can be changed by an admin.
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Failed to proxy image", { status: 502 });
  }
}
