"use client";

import dynamic from "next/dynamic";

/**
 * `@slash-editor/react` touches DOM globals (`DOMRect`) at module scope, so
 * the editor can't be server-rendered. `ssr: false` is only allowed inside a
 * Client Component, which is why this thin wrapper exists: `app/page.tsx`
 * imports from here, never from `editor.tsx` directly.
 */
export const Editor = dynamic(() => import("./editor").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div
      className="bg-card border-border text-muted-foreground min-h-[60vh] rounded-xl border p-10 text-sm shadow-sm"
      aria-busy="true"
    >
      Loading editor…
    </div>
  ),
});
