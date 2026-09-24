import type { Editor } from "@tiptap/core";
import { useCallback, useSyncExternalStore } from "react";

const noop = () => {};
export function useExtensionState<
  S,
  T extends { subscribe(listener: () => void): () => void; state: S },
>(editor: Editor | null, getStorage: (editor: Editor) => T | null, fallback: S): S {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!editor) return noop;
      return getStorage(editor)?.subscribe(listener) ?? noop;
    },
    [editor, getStorage],
  );
  const getSnapshot = useCallback(
    () => (editor ? (getStorage(editor)?.state ?? fallback) : fallback),
    [editor, fallback, getStorage],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}

export { noop };
