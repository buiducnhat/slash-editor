import {
  findChildren,
  findParentNode,
  findParentNodeClosestToPos,
  InputRule,
  mergeAttributes,
  type Editor,
} from "@tiptap/core";
import { Details, type DetailsOptions } from "@tiptap/extension-details";
import {
  Fragment,
  type Node as ProseMirrorNode,
  type NodeType,
  type ResolvedPos,
} from "@tiptap/pm/model";
import { TextSelection, type Transaction } from "@tiptap/pm/state";

export type ToggleOptions = DetailsOptions;

/** Heading level a toggle renders its title at; `0` is a plain toggle list. */
export type ToggleLevel = 0 | 1 | 2 | 3;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      /**
       * Turns the current block into a toggle whose title is that block's
       * text, or re-levels the toggle already holding the selection.
       */
      setToggle: (level?: ToggleLevel) => ReturnType;
      /** Sets the heading level of the toggle holding the selection. */
      setToggleLevel: (level: ToggleLevel) => ReturnType;
    };
  }
}

/** `>` + space: the toggle shorthand. */
export const toggleInputRegex = /^>\s$/;
/** `#`…`###` + space inside a toggle title: the toggle-heading shorthand. */
export const toggleHeadingInputRegex = /^(#{1,3})\s$/;

function asToggleLevel(value: unknown): ToggleLevel {
  return value === 1 || value === 2 || value === 3 ? value : 0;
}

function canReplaceBlockWithToggle($pos: ResolvedPos, detailsType: NodeType): boolean {
  if ($pos.depth === 0 || !$pos.parent.isTextblock) {
    return false;
  }

  const index = $pos.index($pos.depth - 1);

  return $pos.node($pos.depth - 1).canReplaceWith(index, index + 1, detailsType);
}

/**
 * Replaces the textblock holding `pos` with a toggle: that block's inline
 * content becomes the title, the body starts as one empty paragraph, and the
 * caret lands at the end of the title.
 *
 * Titles are `text*`, so inline nodes a summary cannot hold (a mention chip)
 * degrade to their text rather than failing the whole conversion.
 */
function replaceBlockWithToggle(tr: Transaction, pos: number, level: ToggleLevel): boolean {
  const $pos = tr.doc.resolve(pos);
  const { schema } = $pos.parent.type;
  const detailsType = schema.nodes.details;
  const summaryType = schema.nodes.detailsSummary;
  const contentType = schema.nodes.detailsContent;
  const paragraphType = schema.nodes.paragraph;

  if (!detailsType || !summaryType || !contentType || !paragraphType) {
    return false;
  }

  if (!canReplaceBlockWithToggle($pos, detailsType)) {
    return false;
  }

  const inline = $pos.parent.content;
  const text = inline.textBetween(0, inline.size);
  const title = summaryType.contentMatch.matchFragment(inline)?.validEnd
    ? inline
    : text
      ? Fragment.from(schema.text(text))
      : Fragment.empty;

  const summary = summaryType.create(null, title);
  const body = contentType.create(null, paragraphType.create());
  const from = $pos.before($pos.depth);

  /*
   * Left closed: the node view owns `open`, and Tiptap paints its class a
   * tick after creation, so a node that starts open has a body that is still
   * hidden when the next keystroke arrives. `Enter` on the title opens it and
   * hands the caret to the body instead (see `addKeyboardShortcuts`).
   */
  tr.replaceWith(from, $pos.after($pos.depth), detailsType.create({ level }, [summary, body]));
  // from → details, +1 → summary, +1 → its first text position.
  tr.setSelection(TextSelection.create(tr.doc, from + 2 + summary.content.size));

  return true;
}

/** A toggle and its body, as located from a caret position inside one. */
interface ToggleContext {
  /** The `details` wrapper; `depth` is the depth it sits at. */
  details: { pos: number; depth: number; node: ProseMirrorNode };
  /** The `detailsContent` holding the body blocks; `pos` is relative to `details`. */
  content: { pos: number; node: ProseMirrorNode };
}

/**
 * The toggle around `$pos` and its body, or `null`. `details.depth` is the
 * depth the toggle itself sits at, so the block holding `$pos` is at
 * `details.depth + 2` (`details` → `detailsContent` → block).
 */
function toggleAt($pos: ResolvedPos, detailsType: NodeType): ToggleContext | null {
  const details = findParentNodeClosestToPos($pos, (node) => node.type === detailsType);

  if (!details) {
    return null;
  }

  const content = findChildren(details.node, (node) => node.type.name === "detailsContent")[0];

  return content ? { details, content } : null;
}

/** Whether a toggle's body is showing. Absent `open` (no `persist`) means the node view tracks it alone, and a body is only reachable while open. */
function isToggleOpen(node: ProseMirrorNode): boolean {
  return "open" in node.attrs ? Boolean(node.attrs.open) : true;
}

/** What the caret should land on after leaving a toggle's body. */
type LeaveMode =
  /** The nearest position in the following block, creating one only when the toggle ends the document. */
  | "next-block"
  /** A fresh empty paragraph right after the toggle — what Enter on an empty body line produces. */
  | "new-block";

/**
 * Moves the caret past `details`. In `new-block` mode the caret's own block is
 * dropped first (when the body has others), so exiting from an empty line
 * doesn't leave that line behind inside the toggle.
 */
function leaveToggle(editor: Editor, toggle: ToggleContext, mode: LeaveMode): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  const tr = state.tr;
  const blockDepth = toggle.details.depth + 2;

  if (mode === "new-block" && toggle.content.node.childCount > 1 && $from.depth === blockDepth) {
    tr.delete($from.before(blockDepth), $from.after(blockDepth));
  }

  const node = tr.doc.nodeAt(toggle.details.pos);
  const paragraph = state.schema.nodes.paragraph?.createAndFill();

  if (!node || !paragraph) {
    return false;
  }

  const after = toggle.details.pos + node.nodeSize;
  const $after = tr.doc.resolve(after);

  if (mode === "new-block" || !$after.nodeAfter) {
    tr.insert(after, paragraph);
    tr.setSelection(TextSelection.create(tr.doc, after + 1));
  } else {
    tr.setSelection(TextSelection.near($after, 1));
  }

  tr.scrollIntoView();
  view.dispatch(tr);

  return true;
}

/**
 * Tiptap's `Details` with a `level` attribute, the `>` shorthand, and the
 * toggle-heading shorthands.
 *
 * `level` lives on the container rather than the title because the node view
 * renders the disclosure button as a *sibling* of the summary: with
 * `data-level` on the wrapper, one selector sizes both, and the marker stays
 * centred on a title of any size.
 */
export const Toggle = Details.extend<ToggleOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      level: {
        default: 0,
        parseHTML: (element) => asToggleLevel(Number(element.getAttribute("data-level"))),
        // Level 0 renders nothing, so a plain toggle's HTML is unchanged.
        renderHTML: ({ level }) => (level ? { "data-level": String(level) } : {}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  /*
   * Two fixes over Tiptap's own node view, which is otherwise reused as-is:
   *
   * - it writes the wrapper's attributes once, at creation, and its `update`
   *   only repaints the disclosure button, so re-levelling a live toggle left
   *   the DOM stale;
   * - its button click dispatches `setNodeMarkup(pos, undefined, { open })`,
   *   which replaces the attribute set instead of extending it and so wipes
   *   `level` (and the block `id`) on every open/close.
   */
  addNodeView() {
    const parent = this.parent?.();

    if (!parent) {
      return null;
    }

    return (props) => {
      const view = parent(props);
      const dom = view.dom as HTMLElement;
      const applyLevel = (node: ProseMirrorNode) => {
        const level = asToggleLevel(node.attrs.level);

        if (level) {
          dom.setAttribute("data-level", String(level));
        } else {
          dom.removeAttribute("data-level");
        }
      };

      applyLevel(props.node);

      // Capture on the wrapper: an ancestor's capture listener always runs
      // before the button's own, which is the only way to pre-empt it.
      if (this.options.persist) {
        dom.addEventListener(
          "click",
          (event) => {
            const { editor, getPos } = props;
            const target = event.target as HTMLElement | null;

            if (!editor.isEditable || target?.closest("button")?.parentElement !== dom) {
              return;
            }

            event.stopPropagation();

            const pos = getPos();
            const node = typeof pos === "number" ? editor.state.doc.nodeAt(pos) : null;

            if (!node || node.type !== this.type) {
              return;
            }

            const { from, to } = editor.state.selection;

            editor
              .chain()
              .command(({ tr }) => {
                tr.setNodeMarkup(pos as number, undefined, {
                  ...node.attrs,
                  open: !node.attrs.open,
                });

                return true;
              })
              .setTextSelection({ from, to })
              .focus(undefined, { scrollIntoView: false })
              .run();
          },
          true,
        );
      }
      return {
        ...view,
        update: (node, decorations, innerDecorations) => {
          const updated = view.update?.(node, decorations, innerDecorations) ?? true;

          if (updated) {
            applyLevel(node);
          }

          return updated;
        },
      };
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setToggle:
        (level = 0) =>
        ({ state, tr, dispatch }) => {
          const detailsType = state.schema.nodes.details;

          if (!detailsType) {
            return false;
          }

          const details = findParentNode((node) => node.type === detailsType)(state.selection);

          if (details) {
            if (dispatch) {
              tr.setNodeMarkup(details.pos, undefined, { ...details.node.attrs, level });
            }

            return true;
          }

          if (!canReplaceBlockWithToggle(state.selection.$from, detailsType)) {
            return false;
          }

          return dispatch ? replaceBlockWithToggle(tr, state.selection.from, level) : true;
        },
      setToggleLevel:
        (level) =>
        ({ state, tr, dispatch }) => {
          const detailsType = state.schema.nodes.details;
          const details = detailsType
            ? findParentNode((node) => node.type === detailsType)(state.selection)
            : undefined;

          if (!details) {
            return false;
          }

          if (dispatch) {
            tr.setNodeMarkup(details.pos, undefined, { ...details.node.attrs, level });
          }

          return true;
        },
    };
  },

  /*
   * Toggle navigation, and the escape hatches out of a body. Tiptap's own
   * shortcuts only cover some of it — its `Enter` drops the block after the
   * whole toggle when the body is hidden, and nothing moves the caret out of
   * a body downwards — while overriding a key here replaces the parent's
   * binding, so the parent's cases are reimplemented too.
   */
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      /*
       * On a title: hand the caret to the body — into its existing line when
       * that is the fresh toggle's empty placeholder, otherwise into a new
       * block at the top of it — reopening a collapsed toggle first. On an
       * empty last body block: leave the toggle, which is the way back out
       * to the surrounding document.
       */
      Enter: ({ editor }) => {
        const { state, view } = editor;
        const { schema, selection } = state;
        const { $head } = selection;

        if ($head.parent.type === schema.nodes.detailsSummary) {
          const details = findParentNode((node) => node.type === this.type)(selection);
          const contentType = schema.nodes.detailsContent;

          if (!details || !contentType) {
            return false;
          }

          const content = findChildren(details.node, (node) => node.type === contentType)[0];
          const child = content?.node.type.contentMatch.defaultType?.createAndFill();

          if (!content || !child) {
            return false;
          }

          /*
           * Open first and dispatch, so the DOM shows the body before the
           * insert transaction — the detailsSelection plugin snaps
           * selections out of hidden content, and it checks the DOM, which
           * only reflects `open` after a dispatch. With `persist: false`
           * `open` is not an attribute at all, so the node view's class is
           * flipped directly instead.
           */
          if (!isToggleOpen(details.node)) {
            if ("open" in details.node.attrs) {
              view.dispatch(
                state.tr.setNodeMarkup(details.pos, undefined, {
                  ...details.node.attrs,
                  open: true,
                }),
              );
            } else {
              const dom = view.domAtPos(details.pos).node as HTMLElement;

              dom.classList.add(this.options.openClassName);
            }
          }

          /*
           * A body that is one empty block is the placeholder a fresh toggle
           * starts with: hand the caret to that line instead of adding a
           * second one. The block cannot be swapped for a new one in the same
           * transaction — `detailsContent` is `block+`, so removing its only
           * child is a step ProseMirror refuses — and a body that already has
           * content gets the new block on top, right under the title.
           */
          const placeholder = content.node.firstChild;
          const isEmptyBody =
            content.node.childCount === 1 && (placeholder?.content.size ?? 0) === 0;
          const insertPos = details.pos + 1 + content.pos + 1;
          const tr = editor.state.tr;

          if (!isEmptyBody) {
            tr.insert(insertPos, child);
          }

          // insertPos → new block, +1 → its first text position.
          tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
          tr.scrollIntoView();
          view.dispatch(tr);

          return true;
        }

        const toggle = toggleAt($head, this.type);
        const bodyDepth = toggle ? toggle.details.depth + 1 : -1;

        if (
          !toggle ||
          !selection.empty ||
          $head.parent.content.size > 0 ||
          $head.index(bodyDepth) !== toggle.content.node.childCount - 1
        ) {
          return false;
        }

        return leaveToggle(editor, toggle, "new-block");
      },
      /*
       * Down: out of the body from its last block, out of a collapsed
       * toggle from its title. An open title already moves into the body
       * through ProseMirror's default handling, so that case declines.
       */
      ArrowDown: ({ editor }) => {
        const { state } = editor;
        const { schema, selection } = state;
        const { $head } = selection;

        if ($head.parent.type === schema.nodes.detailsSummary) {
          const toggle = toggleAt($head, this.type);

          if (!toggle || isToggleOpen(toggle.details.node)) {
            return false;
          }

          return leaveToggle(editor, toggle, "next-block");
        }

        const toggle = toggleAt($head, this.type);
        const bodyDepth = toggle ? toggle.details.depth + 1 : -1;

        if (
          !toggle ||
          !selection.empty ||
          $head.parentOffset !== $head.parent.content.size ||
          $head.index(bodyDepth) !== toggle.content.node.childCount - 1
        ) {
          return false;
        }

        return leaveToggle(editor, toggle, "next-block");
      },
      /* Up: from the first body block back onto the title. */
      ArrowUp: ({ editor }) => {
        const { state, view } = editor;
        const { selection } = state;
        const { $head } = selection;

        if (!selection.empty || $head.parentOffset !== 0) {
          return false;
        }

        const toggle = toggleAt($head, this.type);

        if (!toggle || $head.index(toggle.details.depth + 1) !== 0) {
          return false;
        }

        const summary = findChildren(
          toggle.details.node,
          (node) => node.type.name === "detailsSummary",
        )[0];

        if (!summary) {
          return false;
        }

        const tr = state.tr;

        /*
         * The end of the title's text: +1 into the details' content, +1 into
         * the summary itself (its content size is its text length).
         */
        tr.setSelection(
          TextSelection.create(tr.doc, toggle.details.pos + 2 + summary.node.content.size),
        );
        tr.scrollIntoView();
        view.dispatch(tr);

        return true;
      },
    };
  },

  addInputRules() {
    return [
      ...(this.parent?.() ?? []),
      new InputRule({
        find: toggleInputRegex,
        handler: ({ state, range }) => {
          const { tr } = state;
          const block = tr.doc.resolve(range.from).parent;
          const name = block.type.name;

          if (name !== "paragraph" && name !== "heading") {
            return null;
          }

          // A heading carries its level into the toggle: `# ` then `> `.
          const level = name === "heading" ? asToggleLevel(block.attrs.level) : 0;

          tr.delete(range.from, range.to);

          // Returning null discards the transaction, delete step included.
          return replaceBlockWithToggle(tr, range.from, level) ? undefined : null;
        },
      }),
      new InputRule({
        find: toggleHeadingInputRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const $from = tr.doc.resolve(range.from);

          // The heading rule runs first and declines here (`heading` is not
          // valid inside `details`), so this only ever sees toggle titles.
          if ($from.parent.type.name !== "detailsSummary") {
            return null;
          }

          const details = $from.node($from.depth - 1);
          const level = asToggleLevel(match[1]?.length);

          tr.delete(range.from, range.to);
          tr.setNodeMarkup($from.before($from.depth - 1), undefined, {
            ...details.attrs,
            level,
          });

          return undefined;
        },
      }),
    ];
  },
});

/** Configures the toggle (details) node. */
export function toggle(options: Partial<ToggleOptions> = {}) {
  return Toggle.configure(options);
}
