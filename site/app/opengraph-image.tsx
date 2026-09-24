import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "slash-editor — Notion-style block editor for React";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "public/logo.png"));
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: "#ffffff",
      }}
    >
      <img src={logoSrc} width={140} height={140} />
      <div style={{ fontSize: 56, fontWeight: 600, color: "#0a0a0a" }}>slash-editor</div>
      <div style={{ fontSize: 28, color: "#737373" }}>Notion-style block editor for React</div>
    </div>,
    { ...size },
  );
}
