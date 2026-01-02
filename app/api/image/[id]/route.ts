import { NextRequest, NextResponse } from "next/server";

function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

function generateGradient(id: string) {
  const hue1 = stringToHue(id);
  const hue2 = (hue1 + 40) % 360;
  const hue3 = (hue1 + 180) % 360; // Complementary

  // Pastel colors using HSL
  const color1 = `hsl(${hue1}, 70%, 85%)`;
  const color2 = `hsl(${hue2}, 80%, 90%)`;
  const color3 = `hsl(${hue3}, 60%, 95%)`;

  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="50%" stop-color="${color2}" />
          <stop offset="100%" stop-color="${color3}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#g)" />
    </svg>
  `;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svg = generateGradient(id);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
