import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { SlashItem } from "./slash-items.ts";

export interface BlockTypeContext {
  editor: Editor;
  /** Position of the block to convert. Omit to convert the block holding the selection. */
  pos?: number;
}

/** A block conversion offered consistently by slash, selection, and block menus. */
export interface BlockType {
  id: string;
  title: string;
  group: string;
  description?: string;
  aliases?: string[];
  keywords?: string[];
  shortcut?: string;
  icon: string;
  when?: (editor: Editor) => boolean;
  isActive: (editor: Editor) => boolean;
  convert: (context: BlockTypeContext) => boolean;
}

export interface BlockTypesStorage {
  types: BlockType[];
}

declare module "@tiptap/core" {
  interface Storage {
    blockTypes: BlockTypesStorage;
  }
}

const BASIC = "Basic blocks";
const ADVANCED = "Advanced blocks";

function hasNode(editor: Editor, name: string): boolean {
  return editor.schema.nodes[name] !== undefined;
}

function selectTarget(editor: Editor, pos: number | undefined) {
  const chain = editor.chain().focus();
  return pos === undefined ? chain : chain.setTextSelection(pos + 1);
}

export const defaultBlockTypes: BlockType[] = [
  {
    id: "paragraph",
    title: "Text",
    group: BASIC,
    description: "Plain paragraph",
    aliases: ["paragraph", "plain"],
    keywords: ["body", "p"],
    icon: "text",
    when: (editor) => hasNode(editor, "paragraph"),
    isActive: (editor) => editor.isActive("paragraph"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setParagraph().run(),
  },
  {
    id: "heading-1",
    title: "Heading 1",
    group: BASIC,
    description: "Large section title",
    aliases: ["h1", "title"],
    keywords: ["#"],
    shortcut: "#",
    icon: "heading-1",
    when: (editor) => hasNode(editor, "heading"),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setNode("heading", { level: 1 }).run(),
  },
  {
    id: "heading-2",
    title: "Heading 2",
    group: BASIC,
    description: "Medium section title",
    aliases: ["h2", "subtitle"],
    keywords: ["##"],
    shortcut: "##",
    icon: "heading-2",
    when: (editor) => hasNode(editor, "heading"),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setNode("heading", { level: 2 }).run(),
  },
  {
    id: "heading-3",
    title: "Heading 3",
    group: BASIC,
    description: "Small section title",
    aliases: ["h3"],
    keywords: ["###"],
    shortcut: "###",
    icon: "heading-3",
    when: (editor) => hasNode(editor, "heading"),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setNode("heading", { level: 3 }).run(),
  },
  {
    id: "bullet-list",
    title: "Bulleted list",
    group: BASIC,
    description: "Unordered list",
    aliases: ["ul", "bullet"],
    keywords: ["-", "*"],
    shortcut: "-",
    icon: "list",
    when: (editor) => hasNode(editor, "bulletList"),
    isActive: (editor) => editor.isActive("bulletList"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    title: "Numbered list",
    group: BASIC,
    description: "Ordered list",
    aliases: ["ol", "numbered"],
    keywords: ["1."],
    shortcut: "1.",
    icon: "list-ordered",
    when: (editor) => hasNode(editor, "orderedList"),
    isActive: (editor) => editor.isActive("orderedList"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).toggleOrderedList().run(),
  },
  {
    id: "task-list",
    title: "To-do list",
    group: BASIC,
    description: "Checklist with checkboxes",
    aliases: ["todo", "checklist", "checkbox"],
    keywords: ["[]", "[ ]"],
    shortcut: "[]",
    icon: "list-checks",
    when: (editor) => hasNode(editor, "taskList"),
    isActive: (editor) => editor.isActive("taskList"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).toggleTaskList().run(),
  },
  {
    id: "blockquote",
    title: "Quote",
    group: BASIC,
    description: "Capture a quotation",
    aliases: ["quote", "citation"],
    keywords: ['"'],
    shortcut: '"',
    icon: "quote",
    when: (editor) => hasNode(editor, "blockquote"),
    isActive: (editor) => editor.isActive("blockquote"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).toggleBlockquote().run(),
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
    isActive: (editor) => editor.isActive("callout"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setCallout().run(),
  },
  {
    id: "toggle",
    title: "Toggle list",
    group: BASIC,
    description: "Collapsible content",
    aliases: ["details", "collapse", "dropdown"],
    keywords: ["toggle"],
    shortcut: ">",
    icon: "chevron-right",
    when: (editor) => hasNode(editor, "details"),
    isActive: (editor) => editor.isActive("details", { level: 0 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setToggle(0).run(),
  },
  {
    id: "code-block",
    title: "Code block",
    group: BASIC,
    description: "Monospaced code",
    aliases: ["code", "snippet"],
    keywords: ["```"],
    shortcut: "```",
    icon: "code",
    when: (editor) => hasNode(editor, "codeBlock"),
    isActive: (editor) => editor.isActive("codeBlock"),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setCodeBlock().run(),
  },
  {
    id: "toggle-heading-1",
    title: "Toggle heading 1",
    group: ADVANCED,
    description: "Collapsible large title",
    aliases: ["th1", "toggleheading1"],
    keywords: ["collapsible", "details"],
    shortcut: "# >",
    icon: "heading-1",
    when: (editor) => hasNode(editor, "details"),
    isActive: (editor) => editor.isActive("details", { level: 1 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setToggle(1).run(),
  },
  {
    id: "toggle-heading-2",
    title: "Toggle heading 2",
    group: ADVANCED,
    description: "Collapsible medium title",
    aliases: ["th2", "toggleheading2"],
    keywords: ["collapsible", "details"],
    shortcut: "## >",
    icon: "heading-2",
    when: (editor) => hasNode(editor, "details"),
    isActive: (editor) => editor.isActive("details", { level: 2 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setToggle(2).run(),
  },
  {
    id: "toggle-heading-3",
    title: "Toggle heading 3",
    group: ADVANCED,
    description: "Collapsible small title",
    aliases: ["th3", "toggleheading3"],
    keywords: ["collapsible", "details"],
    shortcut: "### >",
    icon: "heading-3",
    when: (editor) => hasNode(editor, "details"),
    isActive: (editor) => editor.isActive("details", { level: 3 }),
    convert: ({ editor, pos }) => selectTarget(editor, pos).setToggle(3).run(),
  },
];

export const BlockTypes = Extension.create<{ types: BlockType[] }, BlockTypesStorage>({
  name: "blockTypes",

  addOptions() {
    return { types: defaultBlockTypes };
  },

  addStorage() {
    return { types: this.options.types };
  },
});

export function blockTypes(types: BlockType[] = defaultBlockTypes) {
  return BlockTypes.configure({ types });
}

export function blockTypeSlashItems(types: BlockType[]): SlashItem[] {
  return types.map((type) => ({
    id: type.id,
    title: type.title,
    group: type.group,
    description: type.description,
    aliases: type.aliases,
    keywords: type.keywords,
    shortcut: type.shortcut,
    icon: type.icon,
    when: type.when,
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      type.convert({ editor });
    },
  }));
}

export function activeBlockType(types: BlockType[], editor: Editor): BlockType | null {
  return types.find((type) => (type.when?.(editor) ?? true) && type.isActive(editor)) ?? null;
}
