import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { HeadingLevel } from "./block-kit.ts";
import { findScrollParent } from "./block-drag.ts";

export interface TableOfContentsItem {
  /** The heading's `blockId` attribute, or `null` when `blockId` is opted out. */
  id: string | null;
  /** The heading's `level` attribute. */
  level: HeadingLevel;
  /** The heading's text, whitespace collapsed, suitable for a one-line label. */
  text: string;
  /** Document position of the heading node — the scroll/selection target. */
  pos: number;
}

export interface TableOfContentsState {
  /** Headings eligible for the outline, in document order. */
  items: TableOfContentsItem[];
}

export interface TableOfContentsStorage {
  state: TableOfContentsState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** @internal Set when the document changed ahead of the last scan. */
  dirty: boolean;
  /** @internal Recomputes from the live document. Assigned in `onCreate`. */
  scan: (() => void) | null;
  /** Subscribes to outline changes. Returns an unsubscribe function. */
  subscribe(this: TableOfContentsStorage, listener: () => void): () => void;
  /** @internal Replaces state and notifies subscribers, skipping no-op updates. */
  setState(this: TableOfContentsStorage, next: TableOfContentsState): void;
}

export interface TableOfContentsOptions {
  /** Highest heading level kept; deeper headings are skipped. @default 6 */
  maxLevel: HeadingLevel;
}

export interface ScrollToHeadingOptions {
  /** @default "smooth" */
  behavior?: ScrollBehavior;
}

declare module "@tiptap/core" {
  interface Storage {
    tableOfContents: TableOfContentsStorage;
  }
  interface Commands<ReturnType> {
    tableOfContents: {
      /** Scrolls the block at `pos` to the top of its scrolling container. */
      scrollToHeading: (pos: number, options?: ScrollToHeadingOptions) => ReturnType;
    };
  }
}

const EMPTY: TableOfContentsState = Object.freeze({
  items: Object.freeze([]) as unknown as TableOfContentsItem[],
});

/**
 * The heading outline of `doc`: top-level headings only, in document order.
 *
 * Pure and DOM-free — no `Editor`, no live view — so the scan is unit-testable
 * and usable outside React (a host rendering its own outline calls it straight
 * on `editor.state.doc`). Headings nested inside a container node (toggle,
 * callout, columns, table cell) are deliberately excluded: they are part of
 * their parent block, not of the page structure.
 */
export function computeTableOfContents(
  doc: ProseMirrorNode,
  options: Partial<Pick<TableOfContentsOptions, "maxLevel">> = {},
): TableOfContentsItem[] {
  const maxLevel = options.maxLevel ?? 6;
  const items: TableOfContentsItem[] = [];

  doc.forEach((node, offset) => {
    if (node.type.name !== "heading") {
      return;
    }
    const level = node.attrs.level as number | undefined;
    if (typeof level !== "number" || level > maxLevel) {
      return;
    }
    items.push({
      id: typeof node.attrs.id === "string" ? node.attrs.id : null,
      level: level as HeadingLevel,
      text: node.textBetween(0, node.content.size, " "),
      pos: offset,
    });
  });

  return items;
}

/**
 * The item an outline should highlight for a caret at `from`: the last heading
 * at or before it, or `null` while still above the first one.
 */
export function findActiveItem(
  items: readonly TableOfContentsItem[],
  from: number,
): TableOfContentsItem | null {
  let active: TableOfContentsItem | null = null;
  for (const item of items) {
    if (item.pos > from) {
      break;
    }
    active = item;
  }
  return active;
}

/**
 * The row an outline should highlight from scroll geometry: the index of the
 * last `rect` whose top has reached `containerTop + offset`, or `-1` above the
 * first row.
 *
 * Rects are plain `{ top }` values measured against the same viewport as
 * `containerTop`, so the choice itself stays DOM-free and unit-testable.
 */
export function pickActiveByScroll(
  rects: readonly { top: number }[],
  containerTop: number,
  offset = 0,
): number {
  const anchor = containerTop + offset;
  let active = -1;
  for (const [index, rect] of rects.entries()) {
    if (rect.top > anchor) {
      break;
    }
    active = index;
  }
  return active;
}

function sameItems(left: readonly TableOfContentsItem[], right: readonly TableOfContentsItem[]) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (item, index) =>
      item.id === right[index]!.id &&
      item.level === right[index]!.level &&
      item.text === right[index]!.text &&
      item.pos === right[index]!.pos,
  );
}

/**
 * Document outline store: the top-level heading tree, recomputed whenever the
 * document changes and someone is listening for it.
 *
 * Without a subscriber no scan runs at all — an app that never renders an
 * outline pays nothing for this extension. A subscriber attaching after edits
 * (`dirty: true`) gets one scan before its first read, so it can never observe a
 * stale outline. That implies reading `state.items` through
 * `useExtensionState`/`subscribe`, never a stale closure's copy.
 *
 * An outline is not an insertable block, so this ships no slash item: it is
 * read-only state a UI renders beside the document.
 */
export const TableOfContents = Extension.create<TableOfContentsOptions, TableOfContentsStorage>({
  name: "tableOfContents",

  addOptions() {
    return { maxLevel: 6 };
  },

  // Methods read and write through `this` because Tiptap hands each editor its
  // own storage object; closing over a local would update the wrong copy.
  addStorage() {
    return {
      state: EMPTY,
      listeners: new Set<() => void>(),
      dirty: false,
      scan: null,

      subscribe(listener) {
        this.listeners.add(listener);
        if (this.dirty) {
          this.scan?.();
        }
        return () => this.listeners.delete(listener);
      },

      setState(next) {
        // Unchanged outline is never observable; skip the notification so
        // caret-only transactions don't re-render a list nobody sees change.
        if (sameItems(this.state.items, next.items)) {
          return;
        }
        this.state = next;
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  onCreate() {
    const { editor, options, storage } = this;
    // Bound to the editor this extension instance is wired to, per editor.
    storage.scan = () => {
      storage.dirty = false;
      storage.setState({ items: computeTableOfContents(editor.state.doc, options) });
    };
    storage.scan();
  },

  onTransaction({ transaction }) {
    if (!transaction.docChanged) {
      return;
    }
    this.storage.dirty = true;
    if (this.storage.listeners.size > 0) {
      this.storage.scan?.();
    }
  },

  addCommands() {
    return {
      scrollToHeading:
        (pos: number, options: ScrollToHeadingOptions = {}) =>
        ({ editor }: { editor: Editor }) => {
          const element = headingElement(editor, pos);
          if (!element) {
            return false;
          }
          scrollIntoView(element, options.behavior ?? "smooth");
          return true;
        },
    };
  },
});

/** The heading node's rendered element at `pos`, or `null` when it isn't rendered. */
function headingElement(editor: Editor, pos: number): Element | null {
  if (!editor.state.doc.nodeAt(pos)) {
    return null;
  }
  const dom = editor.view.nodeDOM(pos);
  if (typeof Element !== "undefined" && dom instanceof Element) {
    return dom;
  }
  return dom?.parentElement ?? null;
}

/**
 * Brings `element` to the top of the nearest scroll container that can move,
 * then reveals that container itself.
 *
 * `element.scrollIntoView({ block: "start" })` is not enough here. In a nested
 * chain the browser stops scrolling as soon as the element is visible in the
 * *outer* viewport, so an editor living in its own scrolling pane lands with
 * the heading part-way down that pane — measured at 81px of a 381px move, with
 * only 300px of it applied. Aligning inside the container by hand is exact, and
 * leaves revealing the container (and the document around it) to the browser.
 */
function scrollIntoView(element: Element, behavior: ScrollBehavior): void {
  const container = findScrollParent(element as HTMLElement);

  if (!container || container === document.scrollingElement) {
    element.scrollIntoView({ behavior, block: "start" });
    return;
  }

  // Instant, so the animated alignment below is the last scroll that runs.
  element.scrollIntoView({ block: "nearest" });
  container.scrollTo({
    top:
      container.scrollTop +
      element.getBoundingClientRect().top -
      (container.getBoundingClientRect().top + container.clientTop),
    behavior,
  });
}

/** Configures the document outline extension. */
export function tableOfContents(options: Partial<TableOfContentsOptions> = {}) {
  return TableOfContents.configure(options);
}
