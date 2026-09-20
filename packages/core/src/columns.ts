import { mergeAttributes, Node } from "@tiptap/core";

export interface ColumnsOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface ColumnOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      /** Inserts a `columns` container with `count` empty columns, clamped to 2–6. */
      setColumns: (count?: number) => ReturnType;
    };
  }
}

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 6;
const DEFAULT_COLUMNS = 2;

/**
 * A single column inside `Columns`. Not a `block`-group node itself — it
 * only exists as `columns`'s child — but its `block+` content still picks
 * up a `BlockId` (auto mode matches on `content`, not just `group`), giving
 * every nesting depth stable identity for comment anchoring (M4).
 */
export const Column = Node.create<ColumnOptions>({
  name: "column",
  content: "block+",
  isolating: true,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      0,
    ];
  },
});

/**
 * Side-by-side layout container: the first M2 nesting surface beyond
 * lists. `content: "column{2,}"` bakes the two-column floor into the
 * schema itself, so there is no separate "remove last column" guard to
 * maintain — deleting a column below the minimum is simply not a legal
 * document.
 */
export const Columns = Node.create<ColumnsOptions>({
  name: "columns",
  group: "block",
  content: "column{2,}",
  isolating: true,
  defining: true,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      0,
    ];
  },
  addCommands() {
    return {
      setColumns:
        (count = DEFAULT_COLUMNS) =>
        ({ commands }) => {
          const clamped = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(count)));
          return commands.insertContent({
            type: this.name,
            content: Array.from({ length: clamped }, () => ({
              type: "column",
              content: [{ type: "paragraph" }],
            })),
          });
        },
    };
  },
});

/** Configures the columns container node. */
export function columns(options: Partial<ColumnsOptions> = {}) {
  return Columns.configure(options);
}

/** Configures the column node. */
export function column(options: Partial<ColumnOptions> = {}) {
  return Column.configure(options);
}
