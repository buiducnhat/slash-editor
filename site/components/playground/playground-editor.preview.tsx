"use client";

import dynamic from "next/dynamic";

/**
 * `PlaygroundEditor` constructs a real ProseMirror `Editor` and
 * `@slash-editor/react` touches DOM globals at module scope — SSR-ing it
 * throws. `ssr: false` is only valid from a Client Component boundary, so
 * this thin wrapper holds that boundary; `app/(home)/playground/page.tsx`
 * imports from here, never from `playground-editor.tsx` directly.
 */
export const PlaygroundEditor = dynamic(
  () => import("./playground-editor.tsx").then((mod) => mod.PlaygroundEditor),
  { ssr: false },
);
