import type { MentionItem, MentionState, MentionStorage } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Minimal anchor accepted by floating-ui based popovers. */
export interface MentionMenuAnchor {
  getBoundingClientRect: () => DOMRect;
}

export interface MentionMenu extends MentionState {
  /** Highlighted item, or `null` when nothing matches. */
  activeItem: MentionItem | null;
  /** Virtual anchor tracking the caret; `null` while the menu is closed. */
  anchor: MentionMenuAnchor | null;
  setActiveIndex: (index: number) => void;
  select: (index?: number) => void;
  close: () => void;
}

const CLOSED: MentionState = {
  open: false,
  query: "",
  items: [],
  activeIndex: -1,
  loading: false,
  getClientRect: null,
};

const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

const noop = () => {};

function getStorage(editor: Editor | null): MentionStorage | null {
  return editor?.storage.mention ?? null;
}

/**
 * Subscribes to the mention menu state owned by `@slash-editor/core`.
 *
 * Same shape as `useSlashMenu` plus `loading`, since the provider behind a
 * mention query is async and the slash registry never is.
 */
export function useMention(editor: Editor | null): MentionMenu {
  const subscribe = useCallback(
    (listener: () => void) => getStorage(editor)?.subscribe(listener) ?? noop,
    [editor],
  );
  const getSnapshot = useCallback(() => getStorage(editor)?.state ?? CLOSED, [editor]);

  const state = useSyncExternalStore(subscribe, getSnapshot, () => CLOSED);

  const setActiveIndex = useCallback(
    (index: number) => getStorage(editor)?.setActiveIndex(index),
    [editor],
  );
  const select = useCallback((index?: number) => getStorage(editor)?.select(index), [editor]);
  const close = useCallback(() => getStorage(editor)?.close(), [editor]);

  const anchor = useMemo<MentionMenuAnchor | null>(() => {
    const { getClientRect } = state;

    if (!getClientRect) {
      return null;
    }

    return { getBoundingClientRect: () => getClientRect() ?? EMPTY_RECT };
  }, [state]);

  return {
    ...state,
    activeItem: state.items[state.activeIndex] ?? null,
    anchor,
    setActiveIndex,
    select,
    close,
  };
}
