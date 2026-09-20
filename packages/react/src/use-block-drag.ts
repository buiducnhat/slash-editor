import type { BlockDragState, BlockDragStorage, BlockTarget, DropTarget } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

/** Minimal anchor accepted by floating-ui based popovers and absolutely positioned elements. */
export interface BlockDragAnchor {
  getBoundingClientRect: () => DOMRect;
}

export interface BlockDrag extends BlockDragState {
  /** Anchor tracking the hovered block; `null` while nothing is hovered. */
  hoverAnchor: BlockDragAnchor | null;
  /** Anchor tracking the drop indicator; `null` while not dragging. */
  dropAnchor: BlockDragAnchor | null;
  /** Anchor tracking the block context menu; `null` while closed. */
  menuAnchor: BlockDragAnchor | null;
  /** Block the context menu targets; `null` while closed. */
  menuTarget: BlockTarget | null;
  /** Closes the block context menu. */
  closeMenu: () => void;
  /** Spread onto the gutter handle element: drag past the threshold to reorder, or release early to open the context menu. */
  handleProps: { onPointerDown: (event: React.PointerEvent) => void };
}

const CLOSED: BlockDragState = { hovered: null, dragging: null, drop: null };
const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

/** Pointer travel, in px, under which a press-and-release on the handle opens the context menu instead of dragging. */
const CLICK_THRESHOLD_PX = 4;

const noop = () => {};

function getStorage(editor: Editor | null): BlockDragStorage | null {
  return editor?.storage.blockDrag ?? null;
}

function toAnchor(target: { getClientRect: () => DOMRect | null } | null): BlockDragAnchor | null {
  return target ? { getBoundingClientRect: () => target.getClientRect() ?? EMPTY_RECT } : null;
}

/**
 * Subscribes to the block drag state owned by `@slash-editor/core`.
 *
 * The extension resolves hover and drop targets from raw pointer events; this
 * hook only mirrors state and exposes the pointer-down handoff so a gutter
 * component can start a drag without touching ProseMirror directly. Whether a
 * grip press becomes a drag or a context-menu click is decided here, entirely
 * in React: it is a DOM gesture, not editor state.
 */
export function useBlockDrag(editor: Editor | null): BlockDrag {
  const subscribe = useCallback(
    (listener: () => void) => getStorage(editor)?.subscribe(listener) ?? noop,
    [editor],
  );
  const getSnapshot = useCallback(() => getStorage(editor)?.state ?? CLOSED, [editor]);

  const state = useSyncExternalStore(subscribe, getSnapshot, () => CLOSED);

  const [menuTarget, setMenuTarget] = useState<BlockTarget | null>(null);
  const closeMenu = useCallback(() => setMenuTarget(null), []);

  const handleProps = useMemo(
    () => ({
      onPointerDown: (event: React.PointerEvent) => {
        const storage = getStorage(editor);
        const target = storage?.state.hovered;

        if (!storage || !target) {
          return;
        }

        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Capture is a nice-to-have for fast pointer routing during a drag;
          // the plugin also tracks the pointer at the document level.
        }

        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;

        const onMove = (moveEvent: PointerEvent) => {
          if (moveEvent.pointerId !== pointerId || dragging) {
            return;
          }

          if (
            Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) <= CLICK_THRESHOLD_PX
          ) {
            return;
          }

          dragging = true;
          document.removeEventListener("pointermove", onMove);
          storage.setDragging(target);
        };

        const onUp = (upEvent: PointerEvent) => {
          if (upEvent.pointerId !== pointerId) {
            return;
          }

          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);

          if (!dragging) {
            setMenuTarget(target);
          }
        };

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
      },
    }),
    [editor],
  );

  return {
    ...state,
    hoverAnchor: toAnchor(state.hovered),
    dropAnchor: toAnchor(state.drop),
    menuAnchor: toAnchor(menuTarget),
    menuTarget,
    closeMenu,
    handleProps,
  };
}

export type { BlockDragState, BlockTarget, DropTarget };
