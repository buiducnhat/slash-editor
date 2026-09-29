import {
  findActiveItem,
  pickActiveByScroll,
  type TableOfContentsItem,
  type TableOfContentsState,
  type TableOfContentsStorage,
} from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { noop, useExtensionState } from "./use-extension-state.ts";

export interface TableOfContents extends TableOfContentsState {
  /** The row an outline should highlight, or `null` above the first heading. */
  active: TableOfContentsItem | null;
  /** Highlights `item`, puts the caret in it when editable, and scrolls it to the container top. */
  select: (item: TableOfContentsItem) => void;
}

export interface UseTableOfContentsOptions {
  /** Scrolling container holding the document; defaults to the window. */
  scrollContainer?: RefObject<HTMLElement | null> | null;
  /** Pixels below the container top a heading must reach to become active. @default 0 */
  scrollOffset?: number;
}

const EMPTY: TableOfContentsState = { items: [] };

function getStorage(editor: Editor): TableOfContentsStorage | null {
  return editor.storage.tableOfContents ?? null;
}

/**
 * The document outline and the row to highlight beside it.
 *
 * `active` follows the caret while an editable editor has focus — the
 * selection is the reader's position — and the scroll geometry everywhere
 * else: a read-only document has no caret, and a blurred editor's selection
 * says nothing about what the reader is looking at.
 *
 * ```tsx
 * const toc = useTableOfContents(editor, { scrollContainer: paneRef });
 * ```
 */
export function useTableOfContents(
  editor: Editor | null,
  options: UseTableOfContentsOptions = {},
): TableOfContents {
  const { scrollContainer = null, scrollOffset = 0 } = options;
  const { items } = useExtensionState(editor, getStorage, EMPTY);
  const [active, setActive] = useState<TableOfContentsItem | null>(null);

  const recompute = useCallback(() => {
    if (!editor) {
      return;
    }
    if (editor.isEditable && editor.view.hasFocus()) {
      setActive(findActiveItem(items, editor.state.selection.from));
      return;
    }
    // Items without rendered DOM leave no rect, so the rects and their items
    // stay parallel over the rendered subset only.
    const rects: { top: number }[] = [];
    const rendered: TableOfContentsItem[] = [];
    for (const item of items) {
      // A node view may hand back a text node; its parent is the element.
      const node = editor.view.nodeDOM(item.pos);
      const element = node instanceof Element ? node : (node?.parentElement ?? null);
      if (!element) {
        continue;
      }
      rects.push({ top: element.getBoundingClientRect().top });
      rendered.push(item);
    }
    const containerTop = scrollContainer?.current?.getBoundingClientRect().top ?? 0;
    const index = pickActiveByScroll(rects, containerTop, scrollOffset);
    setActive(index === -1 ? null : (rendered[index] ?? null));
  }, [editor, items, scrollContainer, scrollOffset]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      // Caret moves and edits change the answer; other transactions don't.
      if (transaction.selectionSet || transaction.docChanged) {
        recompute();
      }
    };
    editor.on("transaction", onTransaction);
    editor.on("focus", recompute);
    editor.on("blur", recompute);
    return () => {
      editor.off("transaction", onTransaction);
      editor.off("focus", recompute);
      editor.off("blur", recompute);
    };
  }, [editor, recompute]);

  // Layout effect: the highlight lands before the first paint, so a rendered
  // outline never flashes an unhighlighted row.
  useLayoutEffect(() => {
    if (!editor) {
      return;
    }
    const target: EventTarget = scrollContainer?.current ?? window;
    let frame = 0;
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    // Initial answer, plus every items/options change that re-runs this effect.
    recompute();
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [editor, recompute, scrollContainer]);

  const select = useCallback(
    (item: TableOfContentsItem) => {
      // Optimistic highlight: the row lights up even when no scroll event
      // follows. The two dispatches are sequential, never nested in a command.
      setActive(item);
      if (!editor) {
        return;
      }
      // Jump first, and instantly. An animated scroll issued here loses the
      // race: `focus` below defers its own scroll-into-view to the next frame
      // (see Tiptap's `focus`), and that nearest-edge scroll cancels a running
      // animation, parking the heading at the container's bottom edge instead
      // of its top. Scrolling before the caret moves makes every later scroll
      // a no-op — heading and caret are both already visible.
      editor.commands.scrollToHeading(item.pos, { behavior: "auto" });
      if (editor.isEditable) {
        editor
          .chain()
          .focus(undefined, { scrollIntoView: false })
          .setTextSelection(item.pos + 1)
          .run();
      }
    },
    [editor],
  );

  if (!editor) {
    return { items: EMPTY.items, active: null, select: noop };
  }
  return { items, active, select };
}
