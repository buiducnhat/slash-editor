"use client";

import { CodeBlock, type CommentThreadStore, Mermaid } from "@slash-editor/core";
import { EditorContent } from "@slash-editor/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { useRef } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentPanel } from "@/components/comment-panel.tsx";
import { CodeBlockNodeView } from "@/components/nodes/code-block-node-view.tsx";
import { EmojiMenu } from "@/components/emoji-menu.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { MermaidNodeView } from "@/components/nodes/mermaid-node-view.tsx";
import { PresenceAvatars } from "@/components/presence-avatars.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { TableOfContents } from "@/components/table-of-contents.tsx";
import { createMockCommentThreadStore } from "@/lib/comment-store.ts";
import { createFakePresenceProvider } from "@/lib/fake-presence.ts";
import { mockMentionProvider } from "@/lib/mention-provider.ts";
import { nodeViewExtensions } from "@/lib/node-view-extensions.tsx";
import { mockStreamAdapter } from "@/lib/stream-adapter.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { cn } from "@/lib/utils.ts";

/**
 * One demo per registry item (plus `ReadOnlyDemo` for the read-only guide),
 * wiring the same editor defaults the playground uses (`useDemoEditor`). Every
 * export here is client-only (see `registry-demos.preview.tsx`): a live
 * `Editor` needs a real DOM, and some registry modules touch DOM globals at
 * module scope.
 */

const EDITOR_CLASS = "slash-content min-h-40 pl-24 pr-6 py-8";
const CARD_CLASS = cn(
  "bg-card border-border relative rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

export function SlashMenuDemo() {
  const editor = useDemoEditor({
    content: "<p>Type <code>/</code> on an empty line to open the menu.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

export function BubbleToolbarDemo() {
  const editor = useDemoEditor({
    content: "<p>Select this sentence to see the bubble toolbar appear above it.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <BubbleToolbar editor={editor} />
    </div>
  );
}

export function BlockHandleDemo() {
  const editor = useDemoEditor({
    content:
      "<p>Hover just left of a block for the drag/insert handle.</p><p>Try dragging this paragraph above the one before it.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <BlockHandle editor={editor} />
    </div>
  );
}

export function MentionMenuDemo() {
  const editor = useDemoEditor({
    content: "<p>Type <code>@</code> to mention a teammate.</p>",
    blockKit: { mention: { items: (query, { signal }) => mockMentionProvider(query, signal) } },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <MentionMenu editor={editor} />
    </div>
  );
}

export function EmojiMenuDemo() {
  const editor = useDemoEditor({
    content: "<p>Type <code>:smile</code> or <code>/emoji</code> to pick an emoji.</p>",
    blockKit: { emoji: {} },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
      <EmojiMenu editor={editor} />
    </div>
  );
}

export function LinkEditorDemo() {
  const editor = useDemoEditor({
    content: '<p>Click this <a href="https://prosemirror.net">link</a> to edit or remove it.</p>',
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <LinkEditorPopover editor={editor} />
    </div>
  );
}

export function CommentPanelDemo() {
  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore();
  const store = storeRef.current;
  const editor = useDemoEditor({
    content: "<p>Select some text in this paragraph, then add a comment from the panel.</p>",
    blockKit: { comment: { store } },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className="flex items-start gap-4">
      <div className={cn(CARD_CLASS, "min-w-0 flex-1")}>
        <EditorContent editor={editor} />
      </div>
      <CommentPanel editor={editor} />
    </div>
  );
}

export function PresenceAvatarsDemo() {
  const providerRef = useRef<ReturnType<typeof createFakePresenceProvider> | null>(null);
  providerRef.current ??= createFakePresenceProvider();
  return (
    <div className={cn(CARD_CLASS, "flex items-center gap-3 p-4")}>
      <PresenceAvatars provider={providerRef.current} />
      <p className="text-muted-foreground text-sm">
        Two peers connected (static example — a real page reads this off a live Yjs awareness
        instance).
      </p>
    </div>
  );
}

export function NodeViewsDemo() {
  const editor = useDemoEditor({
    content:
      "<p>Type <code>/image</code>, <code>/file</code>, <code>/video</code>, or <code>/embed</code> to try one.</p>",
    blockKit: {
      image: false,
      file: false,
      video: false,
      embed: false,
      mermaid: false,
      codeBlock: false,
      ai: { adapter: mockStreamAdapter, node: false },
      extend: nodeViewExtensions(),
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

export function MermaidDemo() {
  const editor = useDemoEditor({
    content: `<p>Type <code>/mermaid</code> or <code>\`\`\`mermaid</code> then space to add one.</p><pre data-type="mermaid"><code>sequenceDiagram
    participant You
    participant Editor
    You->>Editor: Click the diagram
    Editor-->>You: Source + live preview</code></pre>`,
    blockKit: {
      mermaid: false,
      extend: [Mermaid.extend({ addNodeView: () => ReactNodeViewRenderer(MermaidNodeView) })],
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

export function CodeBlockDemo() {
  const editor = useDemoEditor({
    content: `<p>Hover the block to pick a language, or type <code>/code</code> to add one.</p><pre><code class="language-ts">export function greet(name: string): string {
  // Tokens are decorations, never stored in the document.
  return \`Hello, \${name}!\`;
}</code></pre>`,
    blockKit: {
      codeBlock: false,
      extend: [CodeBlock.extend({ addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView) })],
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

export function TableOfContentsDemo() {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const editor = useDemoEditor({
    content: `<h1>Trail Notes</h1>
<p>Scroll this pane to read the document; the outline on the right follows along.</p>
<h2>Before you go</h2>
<p>Check the forecast and the trail report before setting out.</p>
<p>Leave your route with someone at home.</p>
<h2>On the trail</h2>
<p>Mark each junction as you pass it so the walk out is easy to follow.</p>
<h3>Creek crossing</h3>
<p>The stones are slick after rain; the log bridge is the better bet.</p>
<h2>Back at camp</h2>
<p>Hang the pack, bank the fire, and note anything the next hiker should know.</p>`,
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) return null;
  return (
    <div className="flex items-start gap-4">
      <div ref={paneRef} className={cn(CARD_CLASS, "max-h-64 overflow-y-auto")}>
        <EditorContent editor={editor} />
      </div>
      <div className="w-48 shrink-0">
        <TableOfContents editor={editor} scrollContainer={paneRef} />
      </div>
    </div>
  );
}

export function ReadOnlyDemo() {
  const editor = useDemoEditor({
    editable: false,
    content: `<h1>Release checklist</h1>
<p>Nothing here can be edited — but you can still follow <a href="#read-only-anchor">this link</a> and toggle the checkboxes below.</p>
<h2>Before merging</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true"><p>Tests pass</p></li>
<li data-type="taskItem" data-checked="false"><p>Docs updated</p></li>
</ul>
<h2>Cut the release</h2>
<pre><code>useSlashEditor({
  editable: false,
  blockKit: { link: { openOnClick: true } },
})</code></pre>`,
    blockKit: {
      link: { openOnClick: true },
      taskItem: { onReadOnlyChecked: () => true },
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Read-only document" } },
  });
  if (!editor) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className={CARD_CLASS}>
          <EditorContent editor={editor} />
        </div>
        <p className="text-muted-foreground text-sm">
          The document is read-only, but links and checkboxes still respond.
        </p>
      </div>
      <div className="w-48 shrink-0">
        <TableOfContents editor={editor} />
      </div>
    </div>
  );
}
