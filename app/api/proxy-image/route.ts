import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL parameters", { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", blob.type);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(blob, { status: 200, headers });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
