import { Extension, type Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Slot a placeholder string is looked up under. Slots are resolved from the
 * empty node *and its parent*: the empty node inside a list item, a task item,
 * a quote or a callout is a plain `paragraph`, so node type alone cannot tell
 * those cases apart.
 */
export type PlaceholderKey =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "listItem"
  | "taskItem"
  | "blockquote"
  | "callout"
  | "details"
  | "toggleHeading1"
  | "toggleHeading2"
  | "toggleHeading3";

export interface PlaceholderContext {
  editor: Editor;
  /** The empty block holding the caret. */
  node: Node;
  /** Its parent, which distinguishes a bare paragraph from a list/quote child. */
  parent: Node | null;
  /** Position directly before `node`. */
  pos: number;
}

export interface PlaceholderOptions {
  /** Per-slot overrides; unset slots keep the default string. */
  text?: Partial<Record<PlaceholderKey, string>>;
  /**
   * Full override. Wins over `text`; returning `null` suppresses the
   * placeholder for that block.
   */
  resolve?: (context: PlaceholderContext) => string | null;
}

export const defaultPlaceholderText: Record<PlaceholderKey, string> = {
  paragraph: "Press '/' for commands…",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  listItem: "List",
  taskItem: "To-do",
  blockquote: "Quote",
  callout: "Callout",
  details: "Toggle",
  toggleHeading1: "Toggle heading 1",
  toggleHeading2: "Toggle heading 2",
  toggleHeading3: "Toggle heading 3",
};

const PARENT_KEYS: Record<string, PlaceholderKey> = {
  listItem: "listItem",
  taskItem: "taskItem",
  blockquote: "blockquote",
  callout: "callout",
  detailsContent: "details",
};

/**
 * Maps an empty block to its placeholder slot, or `null` when it should stay
 * blank. Code blocks are excluded: their content is literal, and a hint would
 * read as source.
 */
export function placeholderKeyFor(node: Node, parent: Node | null): PlaceholderKey | null {
  const name = node.type.name;

  if (name === "heading") {
    const { level } = node.attrs;

    return level === 1 || level === 2 || level === 3 ? (`heading${level}` as PlaceholderKey) : null;
  }

  if (name === "detailsSummary") {
    const level = parent?.attrs.level;

    return level === 1 || level === 2 || level === 3
      ? (`toggleHeading${level}` as PlaceholderKey)
      : "details";
  }

  if (name !== "paragraph") {
    return null;
  }

  return parent ? (PARENT_KEYS[parent.type.name] ?? "paragraph") : "paragraph";
}

export const placeholderPluginKey = new PluginKey("placeholder");

/**
 * Empty-block hints, Notion style: only the block holding the caret shows one.
 *
 * Renders `data-placeholder` and no class names — the UI layer styles
 * `[data-placeholder]::before`, matching how every other core node is styled.
 *
 * The decoration is derived from the state it is drawn against rather than
 * from `editor.state`: during a transaction those are different documents, and
 * resolving a parent in the stale one mislabels every nested block.
 */
export const Placeholder = Extension.create<PlaceholderOptions>({
  name: "placeholder",

  addOptions() {
    return {};
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    const text = { ...defaultPlaceholderText, ...this.options.text };
    const { resolve } = this.options;

    return [
      new Plugin({
        key: placeholderPluginKey,
        props: {
          decorations: (state) => {
            if (!editor.isEditable) {
              return null;
            }

            const { doc, selection } = state;
            const $anchor = doc.resolve(selection.anchor);
            const node = $anchor.parent;

            if (!node.type.isTextblock || node.content.size > 0) {
              return null;
            }

            const parent = $anchor.depth > 0 ? $anchor.node($anchor.depth - 1) : null;
            const pos = $anchor.before($anchor.depth);
            const context = { editor, node, parent, pos };
            const key = placeholderKeyFor(node, parent);
            const value = resolve ? resolve(context) : key && text[key];

            if (!value) {
              return null;
            }

            return DecorationSet.create(doc, [
              Decoration.node(pos, pos + node.nodeSize, { "data-placeholder": value }),
            ]);
          },
        },
      }),
    ];
  },
});

/** Configures empty-block placeholders. */
export function placeholder(options: PlaceholderOptions = {}) {
  return Placeholder.configure(options);
}
