import type { SlashCommandStorage, SlashItem, SlashMenuState } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Minimal anchor accepted by floating-ui based popovers. */
export interface SlashMenuAnchor {
  getBoundingClientRect: () => DOMRect;
}

export interface SlashMenu extends SlashMenuState {
  /** Highlighted item, or `null` when the query matches nothing. */
  activeItem: SlashItem | null;
  /** Virtual anchor tracking the caret; `null` while the menu is closed. */
  anchor: SlashMenuAnchor | null;
  setActiveIndex: (index: number) => void;
  select: (index?: number) => void;
  close: () => void;
}

const CLOSED: SlashMenuState = {
  open: false,
  query: "",
  items: [],
  activeIndex: -1,
  getClientRect: null,
};

const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

const noop = () => {};

function getStorage(editor: Editor | null): SlashCommandStorage | null {
  return editor?.storage.slashCommand ?? null;
}

/**
 * Subscribes to the slash menu state owned by `@slash-editor/core`.
 *
 * The editor keeps focus while the menu is open: navigation and selection are
 * driven by the suggestion plugin's key handler, and this hook only reflects
 * state so a UI layer can render it.
 */
export function useSlashMenu(editor: Editor | null): SlashMenu {
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

  const anchor = useMemo<SlashMenuAnchor | null>(() => {
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
