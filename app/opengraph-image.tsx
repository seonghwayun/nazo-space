import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Share preview for pages without an image of their own (home, search, creator, tag, …).
// Latin text only: the built-in font has no Hangul or kana glyphs.
export const alt = "Nazo Space";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          background: "#f8f8fd",
        }}
      >
        <img src={logoSrc} width={280} height={280} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 104, fontWeight: 800, color: "#14141f", letterSpacing: -2 }}>Nazo Space</div>
          <div style={{ fontSize: 40, color: "#5c5c70" }}>nazo.respace.cc</div>
        </div>
      </div>
    ),
    size
  );
}
