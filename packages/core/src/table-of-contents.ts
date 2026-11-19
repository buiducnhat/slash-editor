import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import type { HeadingLevel } from "./block-kit.ts";
import { findScrollParent } from "./block-drag.ts";
import type { ToggleOptions } from "./toggle.ts";

export interface TableOfContentsItem {
  /** The heading's `blockId` attribute, or `null` when `blockId` is opted out. */
  id: string | null;
  /** The heading's `level` attribute. */
  level: HeadingLevel;
  /** The heading's text, whitespace collapsed, suitable for a one-line label. */
  text: string;
  /** Document position of the heading node — the scroll/selection target. */
  pos: number;
  /**
   * Position of the nearest enclosing toggle (`details` node) that must be
   * open for this item to be visible, or `undefined` when it sits outside
   * every toggle. A toggle's own title is visible while the toggle is closed,
   * so it points at the toggle around it, not itself. Outer toggles are found
   * from there. Only ever set when `includeToggles` is on.
   */
  togglePos?: number;
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
  /**
   * Includes headings nested inside toggles: both a toggle's own title (when
   * its `level` is non-zero) and headings inside its body. Other containers
   * (callout, columns, table cell) stay excluded regardless of this option.
   * `select`/`scrollToHeading` open a closed toggle on the way to an item
   * found this way. @default false
   */
  includeToggles: boolean;
}

export interface ScrollToHeadingOptions {
  /** @default "smooth" */
  behavior?: ScrollBehavior;
  /**
   * Position of a toggle (`details` node) to open first when closed, so a
   * heading hidden inside it is visible before the scroll measures it. Pass
   * `TableOfContentsItem.togglePos`.
   */
  togglePos?: number;
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

function headingItem(
  node: ProseMirrorNode,
  pos: number,
  maxLevel: HeadingLevel,
  togglePos?: number,
): TableOfContentsItem | null {
  const level = node.attrs.level as number | undefined;
  if (typeof level !== "number" || level > maxLevel) {
    return null;
  }
  return {
    id: typeof node.attrs.id === "string" ? node.attrs.id : null,
    level: level as HeadingLevel,
    text: node.textBetween(0, node.content.size, " "),
    pos,
    ...(togglePos === undefined ? {} : { togglePos }),
  };
}

/**
 * Items contributed by one toggle (`details` node) at `pos`: its own title,
 * when leveled, followed by the headings in its body — recursing into a
 * nested toggle the same way. A body heading records this toggle as its
 * `togglePos`; the title records `parentTogglePos`, since it shows while this
 * toggle is closed. Outer toggles are not recorded: `scrollToHeading` walks
 * up from the one named.
 */
function toggleItems(
  details: ProseMirrorNode,
  pos: number,
  maxLevel: HeadingLevel,
  parentTogglePos?: number,
): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];
  const summary = details.firstChild;
  const level = details.attrs.level as number | undefined;

  if (summary && typeof level === "number" && level > 0 && level <= maxLevel) {
    items.push({
      id: typeof details.attrs.id === "string" ? details.attrs.id : null,
      level: level as HeadingLevel,
      text: summary.textBetween(0, summary.content.size, " "),
      pos,
      ...(parentTogglePos === undefined ? {} : { togglePos: parentTogglePos }),
    });
  }

  const content = details.lastChild;
  if (!content) {
    return items;
  }
  // `pos` is the toggle; +1 enters it to the summary, +summary.nodeSize lands
  // on the content node, +1 enters that to its first child.
  const contentStart = pos + 1 + (summary?.nodeSize ?? 0) + 1;
  content.forEach((node, offset) => {
    items.push(...scanBlock(node, contentStart + offset, maxLevel, pos));
  });

  return items;
}

/** Items contributed by one top-level (or toggle-body) block. */
function scanBlock(
  node: ProseMirrorNode,
  pos: number,
  maxLevel: HeadingLevel,
  togglePos?: number,
): TableOfContentsItem[] {
  if (node.type.name === "heading") {
    const item = headingItem(node, pos, maxLevel, togglePos);
    return item ? [item] : [];
  }
  if (node.type.name === "details") {
    return toggleItems(node, pos, maxLevel, togglePos);
  }
  return [];
}

/**
 * The heading outline of `doc`: top-level headings only, in document order —
 * plus, with `includeToggles`, the headings reachable by opening toggles
 * along the way.
 *
 * Pure and DOM-free — no `Editor`, no live view — so the scan is unit-testable
 * and usable outside React (a host rendering its own outline calls it straight
 * on `editor.state.doc`). Headings nested inside any other container node
 * (callout, columns, table cell) are deliberately excluded: they are part of
 * their parent block, not of the page structure.
 */
export function computeTableOfContents(
  doc: ProseMirrorNode,
  options: Partial<Pick<TableOfContentsOptions, "maxLevel" | "includeToggles">> = {},
): TableOfContentsItem[] {
  const maxLevel = options.maxLevel ?? 6;
  const items: TableOfContentsItem[] = [];

  doc.forEach((node, offset) => {
    if (node.type.name === "heading") {
      const item = headingItem(node, offset, maxLevel);
      if (item) {
        items.push(item);
      }
      return;
    }
    if (options.includeToggles && node.type.name === "details") {
      items.push(...toggleItems(node, offset, maxLevel));
    }
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
      item.pos === right[index]!.pos &&
      item.togglePos === right[index]!.togglePos,
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
    return { maxLevel: 6, includeToggles: false };
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
        ({ editor, tr, dispatch }) => {
          const element = headingElement(editor, pos);
          if (!element) {
            return false;
          }
          if (!dispatch) {
            return true;
          }
          // Opening rides on the command's own transaction: Tiptap captured
          // `tr` before this callback and dispatches it after, so dispatching a
          // second transaction here would make that one "mismatched".
          const pending =
            options.togglePos !== undefined && openToggles(editor, tr, options.togglePos);
          const behavior = options.behavior ?? "smooth";
          if (pending) {
            // The open lands when the command returns, so measure after it.
            queueMicrotask(() => {
              const opened = headingElement(editor, pos);
              if (opened) {
                scrollIntoView(opened, behavior);
              }
            });
          } else {
            scrollIntoView(element, behavior);
          }
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
 * Opens the toggle at `togglePos` and every toggle around it, so a heading
 * buried in nested toggles is visible — an open inner toggle inside a closed
 * outer one still shows nothing.
 *
 * With `persist` (an `open` node attr present) the opens are steps on `tr`,
 * applied when the caller's command dispatches; returns `true` when any step
 * was added. With `persist: false`, `open` isn't an attribute — the node view
 * owns it — so each closed toggle is opened through its own disclosure button,
 * which flips the class, the body's `hidden` attribute and the button state
 * together. That only clicks toggles that are closed, so it never closes one.
 * It takes effect immediately and returns `false`.
 */
function openToggles(editor: Editor, tr: Transaction, togglePos: number): boolean {
  const { doc } = tr;
  if (doc.nodeAt(togglePos)?.type.name !== "details") {
    return false;
  }
  const $pos = doc.resolve(togglePos);
  const positions = [togglePos];
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === "details") {
      positions.unshift($pos.before(depth));
    }
  }

  const details = editor.extensionManager.extensions.find(
    (extension) => extension.name === "details",
  );
  const openClassName =
    (details?.options as Partial<ToggleOptions> | undefined)?.openClassName ?? "is-open";
  let stepped = false;

  // Outermost first, so each inner toggle's node view is already visible.
  for (const pos of positions) {
    const node = doc.nodeAt(pos);
    if (!node) {
      continue;
    }
    if ("open" in node.attrs) {
      if (!node.attrs.open) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, open: true });
        stepped = true;
      }
      continue;
    }
    const dom = editor.view.nodeDOM(pos);
    if (dom instanceof HTMLElement && !dom.classList.contains(openClassName)) {
      dom.querySelector<HTMLButtonElement>(":scope > button")?.click();
    }
  }

  return stepped;
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
