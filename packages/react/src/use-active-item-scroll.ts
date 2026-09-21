import { useCallback, useLayoutEffect, useRef } from "react";

export interface ActiveItemScrollOptions {
  /** Attribute carrying an item's id on the list rows. @default "data-value" */
  attribute?: string;
}

/**
 * Keeps the highlighted row of a suggestion list visible.
 *
 * Command palettes scroll themselves only while they own the keyboard. Here
 * the editor never loses focus — the suggestion plugin moves the highlight and
 * the list only receives a controlled value — so nothing scrolls unless the
 * consumer does it. `block: "nearest"` makes this inert for an already visible
 * row, so pointer hover never fights the scroll position.
 *
 * Returns a ref callback for the scroll container:
 *
 * ```tsx
 * const listRef = useActiveItemScroll(menu.activeItem?.id);
 * <CommandList ref={listRef}>…</CommandList>
 * ```
 */
export function useActiveItemScroll(
  activeId: string | null | undefined,
  options: ActiveItemScrollOptions = {},
): (node: HTMLElement | null) => void {
  const { attribute = "data-value" } = options;
  const container = useRef<HTMLElement | null>(null);

  const listRef = useCallback((node: HTMLElement | null) => {
    container.current = node;
  }, []);

  useLayoutEffect(() => {
    const node = container.current;

    if (!node || !activeId || !node.isConnected) {
      return;
    }

    const item = node.querySelector(`[${attribute}="${CSS.escape(activeId)}"]`);

    if (!item) {
      return;
    }

    // A group's first item scrolls its sticky heading in with it, otherwise
    // the heading covers the row the user just moved to.
    const group = item.parentElement;

    if (group?.firstElementChild === item) {
      group.parentElement?.firstElementChild?.scrollIntoView({ block: "nearest" });
    }

    item.scrollIntoView({ block: "nearest" });
  }, [activeId, attribute]);

  return listRef;
}
