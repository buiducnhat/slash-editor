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
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#09090b",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Subtle decorative glow */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(120, 119, 198, 0.25) 0%, rgba(9, 9, 11, 0) 70%)",
          filter: "blur(60px)",
          display: "flex",
        }}
      />

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src={logoSrc}
            width={64}
            height={64}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "#18181b",
            }}
          />
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            slash-editor
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            fontSize: 16,
            fontWeight: 500,
            color: "#a1a1aa",
            letterSpacing: "0.02em",
          }}
        >
          MIT OPEN SOURCE · SHADCN REGISTRY
        </div>
      </div>

      {/* Middle headline & description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "1000px" }}>
        <div
          style={{
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            color: "#ffffff",
          }}
        >
          Notion-style block editing, without the paywall.
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.45,
            color: "#a1a1aa",
          }}
        >
          A headless core on Tiptap/ProseMirror, React bindings, and a shadcn-native UI you install
          as source and own outright.
        </div>
      </div>

      {/* Bottom bar / features & domain */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingTop: 24,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {["Tiptap", "ProseMirror", "shadcn/ui", "Yjs Collab", "AI Actions"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: 16,
                color: "#d4d4d8",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          slasheditor.dev
        </div>
      </div>
    </div>,
    { ...size },
  );
}
