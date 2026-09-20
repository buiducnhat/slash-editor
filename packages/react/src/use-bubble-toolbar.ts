import type {
  BubbleToolbarItem,
  BubbleToolbarState,
  BubbleToolbarStorage,
} from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Minimal anchor accepted by floating-ui based popovers. */
export interface BubbleToolbarAnchor {
  getBoundingClientRect: () => DOMRect;
}

export interface BubbleToolbar extends BubbleToolbarState {
  /** Virtual anchor tracking the selection; `null` while closed. */
  anchor: BubbleToolbarAnchor | null;
}

const CLOSED: BubbleToolbarState = {
  open: false,
  items: [],
  getClientRect: null,
};

const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

const noop = () => {};

function getStorage(editor: Editor | null): BubbleToolbarStorage | null {
  return editor?.storage.bubbleToolbar ?? null;
}

/**
 * Subscribes to the bubble toolbar state owned by `@slash-editor/core`.
 *
 * Unlike the slash menu, there's no keyboard state machine: the core only
 * decides visibility and which items apply, so a UI layer calls
 * `item.isActive(editor)`/`item.run(editor)` directly.
 */
export function useBubbleToolbar(editor: Editor | null): BubbleToolbar {
  const subscribe = useCallback(
    (listener: () => void) => getStorage(editor)?.subscribe(listener) ?? noop,
    [editor],
  );
  const getSnapshot = useCallback(() => getStorage(editor)?.state ?? CLOSED, [editor]);

  const state = useSyncExternalStore(subscribe, getSnapshot, () => CLOSED);

  const anchor = useMemo<BubbleToolbarAnchor | null>(() => {
    const { getClientRect } = state;

    if (!getClientRect) {
      return null;
    }

    return { getBoundingClientRect: () => getClientRect() ?? EMPTY_RECT };
  }, [state]);

  return { ...state, anchor };
}

export type { BubbleToolbarItem };
