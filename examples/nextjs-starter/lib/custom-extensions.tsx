import {
  createAiSlashItems,
  defaultBubbleToolbarItems,
  defaultSlashItems,
  slashCommand,
  type BubbleToolbarItem,
  type SlashItem,
} from "@slash-editor/core";
import type { UseSlashEditorOptions } from "@slash-editor/react";
import { mergeAttributes, Mark, Node } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MAX_RATING, RatingNodeView } from "@/components/nodes/rating-node-view.tsx";
import {
  nextStatusTone,
  STATUS_TONES,
  StatusNodeView,
  type StatusTone,
} from "@/components/nodes/status-node-view.tsx";
import { BLOCK_KIT, KIT_EXTENSIONS } from "@/lib/editor-kit.ts";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    rating: {
      /** Inserts a star rating block at the selection. */
      insertRating: (attrs?: { value?: number; label?: string }) => ReturnType;
    };
    status: {
      /** Inserts an inline status pill at the selection. */
      insertStatus: (attrs?: { tone?: StatusTone; text?: string }) => ReturnType;
    };
    highlight: {
      /** Toggles the highlight mark on the selection. */
      toggleHighlight: () => ReturnType;
    };
  }
}

/**
 * A block atom: a leaf that holds attributes, not content.
 * `renderHTML` writes a readable fallback (stars as text) so `getHTML()`
 * output still means something where the node view isn't mounted, and
 * `parseHTML` reads the attributes back from `data-*`.
 */
export const Rating = Node.create({
  name: "rating",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      value: {
        default: 0,
        parseHTML: (element) =>
          Math.min(MAX_RATING, Math.max(0, Number(element.getAttribute("data-value")) || 0)),
        renderHTML: ({ value }) => ({ "data-value": value }),
      },
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") ?? "",
        renderHTML: ({ label }) => (label ? { "data-label": label } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="rating"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const value = node.attrs.value as number;
    const stars = "★".repeat(value) + "☆".repeat(MAX_RATING - value);

    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": this.name }),
      `${stars} ${node.attrs.label}`.trim(),
    ];
  },

  addCommands() {
    return {
      insertRating:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RatingNodeView);
  },
});

/** An inline atom: it sits in a paragraph like a word, so `group` is `inline`. */
export const Status = Node.create({
  name: "status",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      tone: {
        default: "info" satisfies StatusTone,
        parseHTML: (element) => {
          const tone = element.getAttribute("data-tone") as StatusTone;
          return STATUS_TONES.includes(tone) ? tone : "info";
        },
        renderHTML: ({ tone }) => ({ "data-tone": tone }),
      },
      text: {
        default: "Status",
        parseHTML: (element) => element.getAttribute("data-text") ?? element.textContent,
        renderHTML: ({ text }) => ({ "data-text": text }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="status"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": this.name }), node.attrs.text];
  },

  addCommands() {
    return {
      insertStatus:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addKeyboardShortcuts() {
    return {
      // Keyboard route to the click-to-cycle behaviour of the node view.
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== this.name) {
          return false;
        }
        return editor.commands.updateAttributes(this.name, {
          tone: nextStatusTone(selection.node.attrs.tone),
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatusNodeView);
  },
});

/** A mark, unlike the nodes above: it wraps text instead of replacing it. */
export const Highlight = Mark.create({
  name: "highlight",

  parseHTML() {
    return [{ tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(
        { class: "rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-400/30" },
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    return {
      toggleHighlight:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return { "Mod-Shift-h": () => this.editor.commands.toggleHighlight() };
  },
});

const STATUS_PRESETS: Record<StatusTone, { title: string; text: string }> = {
  info: { title: "Status: In progress", text: "In progress" },
  success: { title: "Status: Done", text: "Done" },
  warning: { title: "Status: At risk", text: "At risk" },
  danger: { title: "Status: Blocked", text: "Blocked" },
};

const CUSTOM_GROUP = "Custom";

/** Appended after the defaults; each item `run`s with the `/query` range to replace. */
export const CUSTOM_SLASH_ITEMS: SlashItem[] = [
  {
    id: "rating",
    title: "Rating",
    group: CUSTOM_GROUP,
    description: "Clickable five-star rating",
    aliases: ["rating", "stars", "review"],
    icon: "star",
    when: (editor) => editor.schema.nodes.rating !== undefined,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertRating({ value: 3 }).run(),
  },
  ...STATUS_TONES.map(
    (tone): SlashItem => ({
      id: `status-${tone}`,
      title: STATUS_PRESETS[tone].title,
      group: CUSTOM_GROUP,
      description: "Inline status pill",
      aliases: ["status", "badge", "pill"],
      icon: "tag",
      when: (editor) => editor.schema.nodes.status !== undefined,
      run: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertStatus({ tone, text: STATUS_PRESETS[tone].text })
          .run(),
    }),
  ),
];

/** Appended after bold/italic/strike/code/link. */
export const HIGHLIGHT_BUBBLE_ITEM: BubbleToolbarItem = {
  id: "highlight",
  label: "Highlight",
  icon: "highlighter",
  shortcut: "⌘⇧H",
  when: (editor) => editor.schema.marks.highlight !== undefined,
  isActive: (editor) => editor.isActive("highlight"),
  run: (editor) => {
    editor.chain().focus().toggleHighlight().run();
  },
};

/**
 * The kit builds its slash item list itself and ignores `blockKit.slash.items`,
 * so custom items go in through a `slashCommand` of our own (with the kit's
 * `slash` turned off): the defaults, the AI actions the kit would add, then ours.
 */
const slash = slashCommand({
  items: (editor) => [
    ...defaultSlashItems,
    ...createAiSlashItems(editor.storage.ai?.actions ?? []),
    ...CUSTOM_SLASH_ITEMS,
  ],
});

/** `BLOCK_KIT` plus the custom nodes, mark, slash items and toolbar button. */
export const CUSTOM_BLOCK_KIT = {
  ...BLOCK_KIT,
  slash: false,
  bubbleToolbar: { items: [...defaultBubbleToolbarItems, HIGHLIGHT_BUBBLE_ITEM] },
  extend: [...KIT_EXTENSIONS, Rating, Status, Highlight, slash],
} satisfies NonNullable<Exclude<UseSlashEditorOptions["blockKit"], false>>;
