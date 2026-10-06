"use client";

import type { JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

/** What the hook knows about the stored document. `undefined` until the browser has been asked. */
type Stored = { content: JSONContent | null } | undefined;

/**
 * Reads a saved Tiptap document from `localStorage` after mount (the server
 * can't, and the editor latches its initial content, so render the editor only
 * once `loaded` is true). `save` and `clear` write through.
 */
export function useStoredDocument(storageKey: string) {
  const [stored, setStored] = useState<Stored>();

  useEffect(() => {
    let content: JSONContent | null = null;

    try {
      const raw = localStorage.getItem(storageKey);
      content = raw ? (JSON.parse(raw) as JSONContent) : null;
    } catch {
      // Corrupt or blocked storage: start from the default document.
    }

    setStored({ content });
  }, [storageKey]);

  const save = useCallback(
    (content: JSONContent) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(content));
      } catch {
        // Quota or privacy mode: the session keeps working, it just won't persist.
      }
    },
    [storageKey],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
  }, [storageKey]);

  return { loaded: stored !== undefined, content: stored?.content ?? null, save, clear };
}
