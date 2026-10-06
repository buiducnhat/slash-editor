"use client";

import { StarIcon, TagIcon } from "lucide-react";
import { DemoHeader } from "@/components/demo-header.tsx";
import {
  DocumentStats,
  EditorWorkspace,
  ReadOnlyToggle,
  useReadOnly,
} from "@/components/editor-surface.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CUSTOM_BLOCK_KIT } from "@/lib/custom-extensions.tsx";
import { EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const CONTENT = `
<h1>Extending the kit</h1>
<p>Everything on this page is registered from <code>lib/custom-extensions.tsx</code>: a block, an inline node, a mark, two slash entries and a toolbar button.</p>
<h2>A rating block</h2>
<div data-type="rating" data-value="4" data-label="Editor experience"></div>
<div data-type="rating" data-value="2" data-label="Click a star, or Tab to the stars and use the arrow keys"></div>
<p>Type <code>/rating</code> on an empty line to add another.</p>
<h2>Status pills</h2>
<p>Inline atoms sit in a sentence like a word. The launch is <span data-type="status" data-tone="success" data-text="Done"></span>, the docs are <span data-type="status" data-tone="info" data-text="In progress"></span>, and the migration is <span data-type="status" data-tone="warning" data-text="At risk"></span>. Click a pill to change its tone, or insert one with <code>/status</code>.</p>
<h2>A highlight mark</h2>
<p>Select some text and use the <mark>highlighter button</mark> in the bubble toolbar, or press <code>⌘⇧H</code>.</p>
`;

const EDITOR_PROPS = {
  attributes: { class: EDITOR_CLASS, "aria-label": "Document" },
};

/*
 * The excerpts below are trimmed copies of `lib/custom-extensions.tsx` and
 * `components/nodes/*`; keep them in step when those change.
 */
const EXCERPTS = [
  {
    title: "Node with a React node view",
    description:
      "A Tiptap node whose attributes round-trip through data-* HTML, rendered by a React component. The view calls updateAttributes, so every click is an undoable transaction.",
    code: `export const Rating = Node.create({
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
      label: { default: "" /* … */ },
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
      \`\${stars} \${node.attrs.label}\`.trim(),
    ];
  },
  addCommands() {
    return {
      insertRating: (attrs) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
  addNodeView: () => ReactNodeViewRenderer(RatingNodeView),
});

// components/nodes/rating-node-view.tsx
<button
  role="radio"
  aria-checked={value === star}
  onClick={() => updateAttributes({ value: value === star ? 0 : star })}
/>`,
  },
  {
    title: "Inline node",
    description:
      "inline: true with group: \"inline\" puts the node inside a paragraph. Keyboard shortcuts belong to the extension, so Enter on a selected pill cycles its tone.",
    code: `export const Status = Node.create({
  name: "status",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      tone: { default: "info" /* … */ },
      text: { default: "Status" /* … */ },
    };
  },
  parseHTML: () => [{ tag: 'span[data-type="status"]' }],
  addKeyboardShortcuts() {
    return {
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
  addNodeView: () => ReactNodeViewRenderer(StatusNodeView),
});`,
  },
  {
    title: "Slash items",
    description:
      "createBlockKit builds the slash list itself and ignores blockKit.slash.items, so the kit's slash is switched off and a slashCommand of our own lists the defaults, the AI actions, then the custom items. Icon keys resolve in lib/icons.ts.",
    code: `const slash = slashCommand({
  items: (editor) => [
    ...defaultSlashItems,
    ...createAiSlashItems(editor.storage.ai?.actions ?? []),
    ...CUSTOM_SLASH_ITEMS,
  ],
});

{
  id: "rating",
  title: "Rating",
  group: "Custom",
  aliases: ["rating", "stars", "review"],
  icon: "star",
  when: (editor) => editor.schema.nodes.rating !== undefined,
  run: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).insertRating({ value: 3 }).run(),
}`,
  },
  {
    title: "Mark and bubble toolbar item",
    description:
      "bubbleToolbar.items replaces the defaults, so spread defaultBubbleToolbarItems and append yours. The mark is a few lines of Tiptap; no extension package needed.",
    code: `export const Highlight = Mark.create({
  name: "highlight",
  parseHTML: () => [{ tag: "mark" }],
  renderHTML: ({ HTMLAttributes }) => ["mark", mergeAttributes({ class: "…" }, HTMLAttributes), 0],
  addCommands() {
    return {
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-h": () => this.editor.commands.toggleHighlight() };
  },
});

export const CUSTOM_BLOCK_KIT = {
  ...BLOCK_KIT,
  slash: false,
  bubbleToolbar: { items: [...defaultBubbleToolbarItems, HIGHLIGHT_BUBBLE_ITEM] },
  extend: [...KIT_EXTENSIONS, Rating, Status, Highlight, slash],
};`,
  },
];

function Excerpts() {
  return (
    <section aria-label="Extension points" className="grid gap-4 md:grid-cols-2">
      {EXCERPTS.map(({ title, description, code }) => (
        <article key={title} className="flex min-w-0 flex-col gap-2">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-muted-foreground text-xs">{description}</p>
          <pre className="bg-muted/50 border-border overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-5">
            <code>{code}</code>
          </pre>
        </article>
      ))}
    </section>
  );
}

export function CustomBlocksDemo() {
  const editor = useDemoEditor({
    content: CONTENT,
    blockKit: CUSTOM_BLOCK_KIT,
    editorProps: EDITOR_PROPS,
  });
  const [readOnly, setReadOnly] = useReadOnly(editor);

  return (
    <>
      <DemoHeader
        title="Custom blocks"
        description="Add your own Tiptap nodes and marks to the kit: a block and an inline node with React node views, slash entries to insert them, and a bubble toolbar button. Nothing is saved."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!editor || readOnly}
              onClick={() => editor?.chain().focus().insertRating({ value: 3 }).run()}
            >
              <StarIcon data-icon="inline-start" />
              Insert rating
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!editor || readOnly}
              onClick={() => editor?.chain().focus().insertStatus({ tone: "info" }).run()}
            >
              <TagIcon data-icon="inline-start" />
              Insert status
            </Button>
            <ReadOnlyToggle readOnly={readOnly} onChange={setReadOnly} />
            <span className="ml-auto">{editor && <DocumentStats editor={editor} />}</span>
          </>
        }
      />
      <EditorWorkspace editor={editor} comments={false} footer={<Excerpts />} />
    </>
  );
}
