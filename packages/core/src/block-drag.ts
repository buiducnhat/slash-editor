import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode, NodeType, ResolvedPos, Schema } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

export type DropMode = "before" | "after" | "inside";

/** A drag unit's geometry at the moment it was measured. No DOM access, so this is what keeps `resolveDropTarget` pure. */
export interface BlockRect {
  pos: number;
  size: number;
  type: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** Immediate container's type — `"doc"` for a top-level block, the list's type for a list item. */
  parentType: string;
  /**
   * Bounds of the nearest ancestor-or-self that is itself a direct doc
   * child — this block for a top-level block, the enclosing list for a
   * list item. The escape hatch when `source` can't sit beside `closest`.
   */
  containerPos: number;
  containerSize: number;
}

export interface DropTarget {
  /** Document position to insert at, already in the pre-move coordinate space. */
  pos: number;
  mode: DropMode;
  /** The block the decision was made against, so a caller can draw an indicator without another DOM lookup. */
  rect: BlockRect;
}

export interface ResolveDropTargetOptions {
  /** Rightward pointer travel, in px, from the source's left edge that turns a drop into a nest. */
  indentThreshold: number;
  /** Whether `target` can legally contain `source` as a child, per the live schema. */
  canNest: (source: BlockRect, target: BlockRect) => boolean;
  /** Whether `source` can legally sit next to `target` — i.e. `target`'s own container accepts `source`. */
  canPlaceBeside: (source: BlockRect, target: BlockRect) => boolean;
}

/**
 * Pure geometry: given the current block rects, the pointer position, and
 * the block being dragged, decides where it would land. No DOM or schema
 * access beyond the injected `canNest` predicate, so the gesture rules are
 * testable without a browser.
 */
export function resolveDropTarget(
  blocks: readonly BlockRect[],
  point: { x: number; y: number },
  source: BlockRect,
  options: ResolveDropTargetOptions,
): DropTarget | null {
  const candidates = blocks.filter(
    (block) => block.pos < source.pos || block.pos >= source.pos + source.size,
  );

  if (candidates.length === 0) {
    return null;
  }

  let closest = candidates[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const block of candidates) {
    const distance = Math.abs(point.y - (block.top + block.bottom) / 2);

    if (distance < closestDistance) {
      closest = block;
      closestDistance = distance;
    }
  }

  const travel = point.x - source.left;

  if (travel > options.indentThreshold && options.canNest(source, closest)) {
    return { pos: closest.pos + closest.size - 1, mode: "inside", rect: closest };
  }

  const after = point.y >= (closest.top + closest.bottom) / 2;

  if (options.canPlaceBeside(source, closest)) {
    return after
      ? { pos: closest.pos + closest.size, mode: "after", rect: closest }
      : { pos: closest.pos, mode: "before", rect: closest };
  }

  // `source` can't sit directly beside `closest` (e.g. a paragraph next to a
  // list item) — place it before/after `closest`'s enclosing top-level block.
  return after
    ? { pos: closest.containerPos + closest.containerSize, mode: "after", rect: closest }
    : { pos: closest.containerPos, mode: "before", rect: closest };
}

/** Deletes `[from, from + size)` and reinserts it at `to`, adjusting for the shift the deletion causes. */
function performMove(tr: Transaction, from: number, size: number, to: number): void {
  const slice = tr.doc.slice(from, from + size);
  const adjustedTo = to > from ? to - size : to;

  tr.delete(from, from + size);
  tr.insert(adjustedTo, slice.content);
}

/** Whether `source` can be inserted as one more child at the end of `target`'s existing content. */
export function canAppendChild(target: ProseMirrorNode, source: NodeType): boolean {
  return target.contentMatchAt(target.childCount).matchType(source) !== null;
}

/** Whether a node of `sourceType` can appear anywhere in `parentType`'s content, per its starting content match. */
function canBeChildType(schema: Schema, sourceType: string, parentType: string): boolean {
  const parent = schema.nodes[parentType];
  const source = schema.nodes[sourceType];

  return (
    parent !== undefined && source !== undefined && parent.contentMatch.matchType(source) !== null
  );
}

/**
 * The draggable unit containing `$pos`: a direct child of the document, a
 * list item at any nesting depth, or a block inside a toggle's body. A
 * paragraph inside a list item carries its own block id (see `BlockId`) but
 * is not itself a drag unit — dragging moves the whole list item, matching
 * Notion's per-row handle.
 */
function resolveBlockAt($pos: ResolvedPos): { pos: number; node: ProseMirrorNode } | null {
  for (let depth = $pos.depth; depth >= 1; depth--) {
    const node = $pos.node(depth);

    if (
      depth === 1 ||
      node.type.name === "listItem" ||
      $pos.node(depth - 1).type.name === "detailsContent"
    ) {
      return { pos: $pos.before(depth), node };
    }
  }

  return null;
}

/** Every drag unit's live position, for sibling lookups and the rect cache. */
function findSibling(
  doc: ProseMirrorNode,
  target: { pos: number; node: ProseMirrorNode },
  direction: -1 | 1,
): { pos: number; size: number } | null {
  const $inside = doc.resolve(target.pos + 1);
  const parentDepth = $inside.depth - 1;

  if (parentDepth < 0) {
    return null;
  }

  const parent = $inside.node(parentDepth);
  const siblingIndex = $inside.index(parentDepth) + direction;

  if (siblingIndex < 0 || siblingIndex >= parent.childCount) {
    return null;
  }

  const parentStart = $inside.start(parentDepth);
  let siblingPos = parentStart;

  for (let i = 0; i < siblingIndex; i++) {
    siblingPos += parent.child(i).nodeSize;
  }

  return { pos: siblingPos, size: parent.child(siblingIndex).nodeSize };
}

export interface BlockTarget {
  pos: number;
  size: number;
  type: string;
  id: string | null;
  /** Live lookup of the block's gutter row — its first line — re-evaluated on every read so scroll/resize never leaves it stale. */
  getClientRect: () => DOMRect | null;
}

export interface BlockDragState {
  hovered: BlockTarget | null;
  dragging: BlockTarget | null;
  drop: (DropTarget & { getClientRect: () => DOMRect | null }) | null;
}

export interface BlockDragStorage {
  state: BlockDragState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** @internal Set once in `onCreate`; lets `setDragging` nudge a decoration recompute. */
  editor: Editor | null;
  /** Subscribes to drag state changes. Returns an unsubscribe function. */
  subscribe(this: BlockDragStorage, listener: () => void): () => void;
  setHovered(this: BlockDragStorage, target: BlockTarget | null): void;
  setDragging(this: BlockDragStorage, target: BlockTarget | null): void;
  setDrop(this: BlockDragStorage, drop: BlockDragState["drop"]): void;
}

declare module "@tiptap/core" {
  interface Storage {
    blockDrag: BlockDragStorage;
  }
  interface Commands<ReturnType> {
    blockDrag: {
      /** Moves the node at `from`/`size` to `to`, as one undo step. */
      moveBlock: (options: { from: number; size: number; to: number }) => ReturnType;
      /** Swaps the block under the selection with its previous sibling. */
      moveBlockUp: () => ReturnType;
      /** Swaps the block under the selection with its next sibling. */
      moveBlockDown: () => ReturnType;
      /** Inserts a copy of the node at `pos`/`size` right after it. */
      duplicateBlock: (options: { pos: number; size: number }) => ReturnType;
      /** Deletes the node at `pos`/`size`. */
      deleteBlock: (options: { pos: number; size: number }) => ReturnType;
    };
  }
}

export const blockDragPluginKey = new PluginKey<null>("blockDrag");

export interface BlockDragOptions {
  /**
   * Pixels to the left of the content box that still resolve to a block,
   * so hovering the gutter (which is rendered outside the editor DOM)
   * highlights the row underneath it.
   *
   * @default 48
   */
  gutterWidth: number;
  /**
   * Pixels of rightward pointer travel that turns a drop into a nest.
   *
   * @default 32
   */
  indentThreshold: number;
  /**
   * Pixels from the nearest scrollable ancestor's edge that scrolls it
   * during a drag.
   *
   * @default 48
   */
  autoScrollMargin: number;
  onError?: (error: unknown, context: { editor: Editor }) => void;
}

const CLOSED_STATE: BlockDragState = Object.freeze({ hovered: null, dragging: null, drop: null });

function findScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;

  while (node) {
    const overflowY = getComputedStyle(node).overflowY;

    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }

    node = node.parentElement;
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function autoScroll(view: EditorView, clientY: number, margin: number): void {
  const scrollParent = findScrollParent(view.dom as HTMLElement);

  if (!scrollParent) {
    return;
  }

  const box = scrollParent.getBoundingClientRect();

  if (clientY < box.top + margin) {
    scrollParent.scrollTop -= box.top + margin - clientY;
  } else if (clientY > box.bottom - margin) {
    scrollParent.scrollTop += clientY - (box.bottom - margin);
  }
}

/**
 * The row the gutter controls ride on: the block's first line of text, as the
 * browser laid it out. Measured through a `Range` rather than read off an
 * element so a block's own padding is accounted for — a callout, a code
 * block, or a table cell anchors to its text, not to its box.
 *
 * A block with no text to measure — a rule, an uploaded image — falls back to
 * its own line box: the controls sit at the block's top instead of centring
 * on a block that can be arbitrarily tall.
 *
 * The block's own left edge and width are kept either way, so every row
 * starts in the same gutter column and stays clear of anything a node view
 * puts to the left of its text (a toggle's disclosure button).
 */
function gutterRowRect(dom: HTMLElement, rect: DOMRect): DOMRect {
  const text = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT).nextNode();

  if (text) {
    const range = document.createRange();

    range.setStart(text, 0);
    range.setEnd(text, 1);

    const line = range.getBoundingClientRect();

    if (line.height > 0) {
      return new DOMRect(rect.left, line.top, rect.width, line.height);
    }
  }

  const { lineHeight } = getComputedStyle(dom);
  const height = Number.parseFloat(lineHeight);

  return new DOMRect(
    rect.left,
    rect.top,
    rect.width,
    Number.isFinite(height) ? Math.min(height, rect.height) : rect.height,
  );
}

function toBlockTarget(view: EditorView, pos: number): BlockTarget | null {
  const node = view.state.doc.nodeAt(pos);

  if (!node) {
    return null;
  }

  return {
    pos,
    size: node.nodeSize,
    type: node.type.name,
    id: typeof node.attrs.id === "string" ? node.attrs.id : null,
    getClientRect: () => {
      const dom = view.nodeDOM(pos);

      if (!(dom instanceof HTMLElement)) {
        return null;
      }

      return gutterRowRect(dom, dom.getBoundingClientRect());
    },
  };
}

/**
 * Resolves the block under viewport coordinates from cached rects, not
 * `posAtCoords`: the gutter and a block's own left padding are empty space
 * with no caret position there, where `posAtCoords` reliably returns
 * nothing. Matches the smallest (most specific) rect whose vertical range
 * contains the pointer, so a list item wins over its enclosing list.
 */
function resolveHover(
  view: EditorView,
  clientX: number,
  clientY: number,
  gutterWidth: number,
  rects: readonly BlockRect[],
): BlockTarget | null {
  const box = view.dom.getBoundingClientRect();

  if (
    clientY < box.top ||
    clientY > box.bottom ||
    clientX < box.left - gutterWidth ||
    clientX > box.right
  ) {
    return null;
  }

  let match: BlockRect | null = null;

  for (const rect of rects) {
    if (clientY < rect.top || clientY > rect.bottom) {
      continue;
    }

    if (!match || rect.bottom - rect.top < match.bottom - match.top) {
      match = rect;
    }
  }

  return match ? toBlockTarget(view, match.pos) : null;
}

function computeRects(view: EditorView): BlockRect[] {
  const rects: BlockRect[] = [];

  view.state.doc.descendants((node, pos, parent) => {
    if (
      !parent ||
      (parent.type.name !== "doc" &&
        parent.type.name !== "detailsContent" &&
        node.type.name !== "listItem")
    ) {
      return;
    }

    const dom = view.nodeDOM(pos);

    if (dom instanceof HTMLElement) {
      const rect = dom.getBoundingClientRect();
      const $pos = view.state.doc.resolve(pos);
      const depth = $pos.depth;
      const container =
        depth === 0
          ? { pos, size: node.nodeSize }
          : { pos: $pos.before(depth), size: $pos.node(depth).nodeSize };

      rects.push({
        pos,
        size: node.nodeSize,
        type: node.type.name,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        parentType: $pos.node(depth).type.name,
        containerPos: container.pos,
        containerSize: container.size,
      });
    }
  });

  return rects;
}

/**
 * Hover targeting, pointer-driven reordering, and list nesting for the
 * block gutter. Geometry is pointer-driven (not HTML5 DnD) so the drop
 * indicator and the nest gesture stay fully in our control; the gutter
 * itself is rendered by the registry layer, anchored to `state.hovered`.
 */
export const BlockDrag = Extension.create<BlockDragOptions, BlockDragStorage>({
  name: "blockDrag",

  addOptions() {
    return { gutterWidth: 48, indentThreshold: 32, autoScrollMargin: 48 };
  },

  addStorage() {
    return {
      state: CLOSED_STATE,
      listeners: new Set<() => void>(),
      editor: null,

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },

      setHovered(target) {
        if (this.state.hovered === target) {
          return;
        }
        this.state = { ...this.state, hovered: target };
        this.listeners.forEach((listener) => listener());
      },

      setDragging(target) {
        this.state = { ...this.state, dragging: target, drop: target ? this.state.drop : null };
        this.listeners.forEach((listener) => listener());

        // Drag state lives outside the transaction pipeline, so decorations
        // (the dragged block's fade) never see it change on their own. A
        // no-op transaction forces the view to recompute them.
        const { editor } = this;
        if (editor && !editor.isDestroyed) {
          editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false));
        }
      },

      setDrop(drop) {
        this.state = { ...this.state, drop };
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  onCreate() {
    this.storage.editor = this.editor;
  },

  addCommands() {
    return {
      moveBlock:
        ({ from, size, to }) =>
        ({ tr, dispatch, state }) => {
          if (!state.doc.nodeAt(from)) {
            return false;
          }

          if (dispatch) {
            performMove(tr, from, size, to);
          }

          return true;
        },
      moveBlockUp:
        () =>
        ({ tr, dispatch, state }) => {
          const target = resolveBlockAt(state.selection.$from);
          const sibling = target && findSibling(state.doc, target, -1);

          if (!target || !sibling) {
            return false;
          }

          if (dispatch) {
            performMove(tr, target.pos, target.node.nodeSize, sibling.pos);
          }

          return true;
        },
      moveBlockDown:
        () =>
        ({ tr, dispatch, state }) => {
          const target = resolveBlockAt(state.selection.$from);
          const sibling = target && findSibling(state.doc, target, 1);

          if (!target || !sibling) {
            return false;
          }

          if (dispatch) {
            performMove(tr, target.pos, target.node.nodeSize, sibling.pos + sibling.size);
          }

          return true;
        },
      duplicateBlock:
        ({ pos, size }) =>
        ({ tr, dispatch, state }) => {
          const node = state.doc.nodeAt(pos);

          if (!node || node.nodeSize !== size) {
            return false;
          }

          // The copy's id collides with the original; BlockId's own
          // appendTransaction pass regenerates it for whichever occurrence
          // falls inside this transaction's changed range.
          if (dispatch) {
            tr.insert(pos + size, node.copy(node.content));
          }

          return true;
        },
      deleteBlock:
        ({ pos, size }) =>
        ({ tr, dispatch, state }) => {
          const node = state.doc.nodeAt(pos);

          if (!node || node.nodeSize !== size) {
            return false;
          }

          if (dispatch) {
            tr.delete(pos, pos + size);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Alt-Shift-ArrowUp": () => this.editor.commands.moveBlockUp(),
      "Alt-Shift-ArrowDown": () => this.editor.commands.moveBlockDown(),
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    const { gutterWidth, indentThreshold, autoScrollMargin, onError } = this.options;
    const getStorage = () => editor.storage.blockDrag;

    return [
      new Plugin({
        key: blockDragPluginKey,
        props: {
          decorations: (state) => {
            const dragging = getStorage().state.dragging;

            if (!dragging) {
              return null;
            }

            const node = state.doc.nodeAt(dragging.pos);

            if (!node) {
              return null;
            }

            return DecorationSet.create(state.doc, [
              Decoration.node(dragging.pos, dragging.pos + node.nodeSize, { "data-dragging": "" }),
            ]);
          },
        },
        view: (view) => {
          let rects: BlockRect[] = [];
          let rectsDirty = true;

          const handlePointerMove = (event: PointerEvent) => {
            if (event.pointerType === "touch") {
              return;
            }

            const storage = getStorage();

            if (rectsDirty) {
              rects = computeRects(view);
              rectsDirty = false;
            }

            if (!storage.state.dragging) {
              storage.setHovered(
                resolveHover(view, event.clientX, event.clientY, gutterWidth, rects),
              );
              return;
            }

            const { dragging } = storage.state;
            const source = rects.find((rect) => rect.pos === dragging.pos);

            if (!source) {
              storage.setDrop(null);
              return;
            }

            const drop = resolveDropTarget(rects, { x: event.clientX, y: event.clientY }, source, {
              indentThreshold,
              canNest: (fromRect, toRect) => {
                const targetNode = view.state.doc.nodeAt(toRect.pos);
                const sourceType = view.state.schema.nodes[fromRect.type];
                return (
                  targetNode !== null &&
                  sourceType !== undefined &&
                  canAppendChild(targetNode, sourceType)
                );
              },
              canPlaceBeside: (fromRect, toRect) =>
                canBeChildType(view.state.schema, fromRect.type, toRect.parentType),
            });

            storage.setDrop(
              drop && {
                ...drop,
                getClientRect: () => {
                  const { rect, mode } = drop;

                  if (mode === "before") {
                    return new DOMRect(rect.left, rect.top - 1, rect.right - rect.left, 2);
                  }
                  if (mode === "after") {
                    return new DOMRect(rect.left, rect.bottom - 1, rect.right - rect.left, 2);
                  }
                  return new DOMRect(
                    rect.left + 24,
                    rect.bottom - 1,
                    rect.right - rect.left - 24,
                    2,
                  );
                },
              },
            );

            autoScroll(view, event.clientY, autoScrollMargin);
          };

          const handlePointerUp = () => {
            const storage = getStorage();
            const { dragging, drop } = storage.state;

            if (dragging && drop) {
              try {
                editor.commands.moveBlock({
                  from: dragging.pos,
                  size: dragging.size,
                  to: drop.pos,
                });
              } catch (error) {
                if (onError) {
                  onError(error, { editor });
                } else {
                  throw error;
                }
              }
            }

            storage.setDragging(null);
            storage.setDrop(null);
          };

          const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && getStorage().state.dragging) {
              getStorage().setDragging(null);
              getStorage().setDrop(null);
            }
          };

          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp);
          document.addEventListener("pointercancel", handlePointerUp);
          document.addEventListener("keydown", handleKeyDown);

          return {
            update: () => {
              rectsDirty = true;
            },
            destroy: () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
              document.removeEventListener("pointercancel", handlePointerUp);
              document.removeEventListener("keydown", handleKeyDown);
            },
          };
        },
      }),
    ];
  },
});

/** Configures the block drag extension. */
export function blockDrag(options: Partial<BlockDragOptions> = {}) {
  return BlockDrag.configure(options);
}
