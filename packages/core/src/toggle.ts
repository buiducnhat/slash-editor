import { findParentNode, InputRule, mergeAttributes } from "@tiptap/core";
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

  tr.replaceWith(from, $pos.after($pos.depth), detailsType.create({ level }, [summary, body]));
  // from → details, +1 → summary, +1 → its first text position.
  tr.setSelection(TextSelection.create(tr.doc, from + 2 + summary.content.size));

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
