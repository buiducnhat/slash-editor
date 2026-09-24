import type { Editor, Range } from "@tiptap/core";
import { blockTypeSlashItems, defaultBlockTypes } from "./block-types.ts";

export type { BlockType, BlockTypeContext } from "./block-types.ts";

export interface SlashContext {
  editor: Editor;
  /** Document range covering the trigger character and the typed query. */
  range: Range;
}

export interface SlashItem {
  /** Stable identity used for keyboard selection and analytics. */
  id: string;
  title: string;
  /** Section the item is listed in. */
  group: string;
  description?: string;
  aliases?: string[];
  keywords?: string[];
  shortcut?: string;
  /** Icon key resolved by the UI layer; the core ships no components. */
  icon?: string;
  /** Hides the item when the current editor cannot run it. */
  when?: (editor: Editor) => boolean;
  run: (context: SlashContext) => void;
}

const TITLE_PREFIX = 100;
const TITLE_WORD_PREFIX = 80;
const ALIAS_PREFIX = 60;
const TITLE_SUBSTRING = 40;
const KEYWORD_MATCH = 20;

function score(item: SlashItem, query: string): number {
  const title = item.title.toLowerCase();

  if (title.startsWith(query)) return TITLE_PREFIX;
  if (title.split(/\s+/).some((word) => word.startsWith(query))) return TITLE_WORD_PREFIX;
  if (item.aliases?.some((alias) => alias.toLowerCase().startsWith(query))) return ALIAS_PREFIX;
  if (title.includes(query)) return TITLE_SUBSTRING;
  if (item.keywords?.some((keyword) => keyword.toLowerCase().includes(query))) return KEYWORD_MATCH;
  return 0;
}

/** Ranks slash items while preserving declaration order for ties. */
export function filterSlashItems(items: SlashItem[], query: string, editor?: Editor): SlashItem[] {
  const available = editor ? items.filter((item) => item.when?.(editor) ?? true) : items;
  const normalized = query.trim().toLowerCase();

  if (!normalized) return available;

  return available
    .map((item) => ({ item, score: score(item, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

function hasNode(editor: Editor, name: string): boolean {
  return editor.schema.nodes[name] !== undefined;
}

const BASIC = "Basic blocks";
const MEDIA = "Media";
const STRUCTURE = "Structure";

const MEDIA_ITEMS: SlashItem[] = [
  {
    id: "horizontal-rule",
    title: "Divider",
    group: BASIC,
    description: "Visual separator",
    aliases: ["divider", "hr", "rule"],
    keywords: ["---"],
    shortcut: "---",
    icon: "minus",
    when: (editor) => hasNode(editor, "horizontalRule"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    id: "image",
    title: "Image",
    group: MEDIA,
    description: "Upload or embed an image",
    aliases: ["image", "picture", "photo"],
    keywords: ["img"],
    icon: "image",
    when: (editor) => hasNode(editor, "image"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setImage().run(),
  },
  {
    id: "file",
    title: "File",
    group: MEDIA,
    description: "Upload or attach a file",
    aliases: ["file", "attachment", "upload"],
    keywords: ["doc", "pdf"],
    icon: "paperclip",
    when: (editor) => hasNode(editor, "file"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setFile().run(),
  },
  {
    id: "video",
    title: "Video",
    group: MEDIA,
    description: "Upload or embed a video",
    aliases: ["video", "movie"],
    keywords: ["mp4"],
    icon: "video",
    when: (editor) => hasNode(editor, "video"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setVideo().run(),
  },
  {
    id: "embed",
    title: "Embed",
    group: MEDIA,
    description: "Bookmark or iframe a link",
    aliases: ["embed", "bookmark", "link", "iframe"],
    keywords: ["url"],
    icon: "link",
    when: (editor) => hasNode(editor, "embed"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setEmbed().run(),
  },
  {
    id: "table",
    title: "Table",
    group: STRUCTURE,
    description: "Rows and columns of cells",
    aliases: ["table", "grid"],
    keywords: ["spreadsheet"],
    icon: "table",
    when: (editor) => hasNode(editor, "table"),
    run: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "columns",
    title: "Columns",
    group: STRUCTURE,
    description: "Side-by-side layout",
    aliases: ["columns", "layout"],
    keywords: ["split"],
    icon: "columns",
    when: (editor) => hasNode(editor, "columns"),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setColumns(2).run(),
  },
];

/** All built-in slash items, with block conversion sourced from `defaultBlockTypes`. */
export const defaultSlashItems: SlashItem[] = [
  ...blockTypeSlashItems(defaultBlockTypes),
  ...MEDIA_ITEMS,
];

export { blockTypeSlashItems, defaultBlockTypes } from "./block-types.ts";
