"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { useEffect, useState, type ReactNode } from "react";

function MetaOrControl() {
  const [key, setKey] = useState("⌘");
  useEffect(() => {
    if (/Windows|Linux/i.test(window.navigator.userAgent)) {
      setKey("Ctrl");
    }
  }, []);
  return key;
}

/**
 * Fumadocs' default search hotkey listens for ⌘K/Ctrl+K on `window` and
 * opens even when something earlier already handled the key. The editor
 * binds the same chord to its link editor (ProseMirror calls
 * `preventDefault()` when a binding runs), so search only claims the event
 * when the editor let it fall through.
 */
const searchHotKey = [
  {
    key: (event: KeyboardEvent) => (event.metaKey || event.ctrlKey) && !event.defaultPrevented,
    display: <MetaOrControl />,
  },
  { key: "k", display: "K" },
];

export function SiteProvider({ children }: { children: ReactNode }) {
  return <RootProvider search={{ hotKey: searchHotKey }}>{children}</RootProvider>;
}
