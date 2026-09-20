import type { Editor, Range } from "@tiptap/core";

export interface SlashContext {
  editor: Editor;
  /** Document range covering the trigger character and the typed query. */
  range: Range;
}

export interface SlashItem {
  /** Stable identity used for keyboard selection and analytics. */
  id: string;
  title: string;
  /** Section the item is listed under. */
  group: string;
  /** One-line hint rendered next to the title. */
  description?: string;
  /** Alternative names matched with the same weight as the title. */
  aliases?: string[];
  /** Lower-weight search terms that are never displayed. */
  keywords?: string[];
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

  if (title.startsWith(query)) {
    return TITLE_PREFIX;
  }
  if (title.split(/\s+/).some((word) => word.startsWith(query))) {
    return TITLE_WORD_PREFIX;
  }
  if (item.aliases?.some((alias) => alias.toLowerCase().startsWith(query))) {
    return ALIAS_PREFIX;
  }
  if (title.includes(query)) {
    return TITLE_SUBSTRING;
  }
  if (item.keywords?.some((keyword) => keyword.toLowerCase().includes(query))) {
    return KEYWORD_MATCH;
  }
  return 0;
}

/**
 * Ranks items against a slash query. Ties keep declaration order, so the item
 * list doubles as the default ordering of the menu.
 */
export function filterSlashItems(items: SlashItem[], query: string, editor?: Editor): SlashItem[] {
  const available = editor ? items.filter((item) => item.when?.(editor) ?? true) : items;
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return available;
  }

  return available
    .map((item) => ({ item, score: score(item, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

const BASIC = "Basic blocks";

function hasNode(editor: Editor, name: string): boolean {
  return editor.schema.nodes[name] !== undefined;
}

export const defaultSlashItems: SlashItem[] = [
  {
    id: "paragraph",
    title: "Text",
    group: BASIC,
    description: "Plain paragraph",
    aliases: ["paragraph", "plain"],
    keywords: ["body", "p"],
    icon: "text",
    when: (editor) => hasNode(editor, "paragraph"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    id: "heading-1",
    title: "Heading 1",
    group: BASIC,
    description: "Large section title",
    aliases: ["h1", "title"],
    keywords: ["#"],
    icon: "heading-1",
    when: (editor) => hasNode(editor, "heading"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    id: "heading-2",
    title: "Heading 2",
    group: BASIC,
    description: "Medium section title",
    aliases: ["h2", "subtitle"],
    keywords: ["##"],
    icon: "heading-2",
    when: (editor) => hasNode(editor, "heading"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    id: "heading-3",
    title: "Heading 3",
    group: BASIC,
    description: "Small section title",
    aliases: ["h3"],
    keywords: ["###"],
    icon: "heading-3",
    when: (editor) => hasNode(editor, "heading"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    id: "bullet-list",
    title: "Bulleted list",
    group: BASIC,
    description: "Unordered list",
    aliases: ["ul", "bullet"],
    keywords: ["-", "*"],
    icon: "list",
    when: (editor) => hasNode(editor, "bulletList"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: "ordered-list",
    title: "Numbered list",
    group: BASIC,
    description: "Ordered list",
    aliases: ["ol", "numbered"],
    keywords: ["1."],
    icon: "list-ordered",
    when: (editor) => hasNode(editor, "orderedList"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: "task-list",
    title: "To-do list",
    group: BASIC,
    description: "Checklist with checkboxes",
    aliases: ["todo", "checklist", "checkbox"],
    keywords: ["[]", "[ ]"],
    icon: "list-checks",
    when: (editor) => hasNode(editor, "taskList"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    id: "blockquote",
    title: "Quote",
    group: BASIC,
    description: "Capture a quotation",
    aliases: ["quote", "citation"],
    keywords: [">"],
    icon: "quote",
    when: (editor) => hasNode(editor, "blockquote"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: "callout",
    title: "Callout",
    group: BASIC,
    description: "Highlighted aside",
    aliases: ["note", "info", "tip"],
    keywords: ["!"],
    icon: "message-square",
    when: (editor) => hasNode(editor, "callout"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout().run();
    },
  },
  {
    id: "toggle",
    title: "Toggle list",
    group: BASIC,
    description: "Collapsible content",
    aliases: ["details", "collapse", "dropdown"],
    keywords: ["toggle"],
    icon: "chevron-right",
    when: (editor) => hasNode(editor, "details"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDetails().run();
    },
  },
  {
    id: "code-block",
    title: "Code block",
    group: BASIC,
    description: "Monospaced code",
    aliases: ["code", "snippet"],
    keywords: ["```"],
    icon: "code",
    when: (editor) => hasNode(editor, "codeBlock"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    id: "horizontal-rule",
    title: "Divider",
    group: BASIC,
    description: "Visual separator",
    aliases: ["divider", "hr", "rule"],
    keywords: ["---"],
    icon: "minus",
    when: (editor) => hasNode(editor, "horizontalRule"),
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];
