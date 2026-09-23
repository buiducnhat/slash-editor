import { type MarkdownToken, mergeAttributes, Node } from "@tiptap/core";
import {
  blockChildren,
  markerLinePattern,
  markerStart,
  readMarker,
  renderClosingMarker,
  renderMarker,
  scanBlock,
} from "./markdown-syntax.ts";

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

// GFM has no columns: on GitHub they read top to bottom, and the markers
// (hidden there) carry the split back in.
const COLUMNS_SYNTAX = {
  open: markerLinePattern("columns"),
  close: markerLinePattern("columns", true),
  separator: markerLinePattern("column"),
};

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
  renderMarkdown: (node, h) =>
    [
      renderMarker("columns"),
      (node.content ?? [])
        .map((column) => h.renderChildren(column.content ?? [], "\n\n"))
        .join(`\n\n${renderMarker("column")}\n\n`),
      renderClosingMarker("columns"),
    ].join("\n\n"),
  markdownTokenizer: {
    name: "columns",
    level: "block",
    start: markerStart("columns"),
    tokenize(src, _tokens, lexer) {
      const open = readMarker(src, "columns");
      const rest = open ? src.slice(open.raw.length) : "";
      const block = open ? scanBlock(rest, COLUMNS_SYNTAX) : undefined;

      // Below the schema's two-column floor there is nothing to rebuild;
      // declining leaves the markers to the catch-all and the content in place.
      if (!open || !block || block.parts.length < MIN_COLUMNS) {
        return undefined;
      }

      return {
        type: "columns",
        raw: open.raw + rest.slice(0, block.length),
        columns: block.parts.map((part) => lexer.blockTokens(part)),
      };
    },
  },
  parseMarkdown: (token, h) =>
    h.createNode(
      "columns",
      undefined,
      (token.columns as MarkdownToken[][]).map((tokens) =>
        h.createNode("column", undefined, blockChildren(tokens, h)),
      ),
    ),
});

/** Configures the columns container node. */
export function columns(options: Partial<ColumnsOptions> = {}) {
  return Columns.configure(options);
}

/** Configures the column node. */
export function column(options: Partial<ColumnOptions> = {}) {
  return Column.configure(options);
}
