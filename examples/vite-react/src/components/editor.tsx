"use client";

import type { CommentThreadStore } from "@slash-editor/core";
import { markdown } from "@slash-editor/core/markdown";
import { EditorContent } from "@slash-editor/react";
import { useRef } from "react";
import { BlockHandle } from "@/components/block-handle";
import { BubbleToolbar } from "@/components/bubble-toolbar";
import { CommentComposer } from "@/components/comment-composer";
import { CommentPanel } from "@/components/comment-panel";
import { LinkEditorPopover } from "@/components/link-editor-popover";
import { MentionMenu } from "@/components/mention-menu";
import { SlashMenu } from "@/components/slash-menu";
import { TableOfContents } from "@/components/table-of-contents";
import { createMockCommentThreadStore } from "@/lib/comment-store";
import { mockMentionProvider } from "@/lib/mention-provider";
import { nodeViewExtensions } from "@/lib/node-view-extensions";
import { mockStreamAdapter } from "@/lib/stream-adapter";
import { useDemoEditor } from "@/lib/use-demo-editor";

const INITIAL_CONTENT = `
<h1>Welcome to slash-editor</h1>
<p>A Notion-style block editor for React. Type <code>/</code> on an empty line to insert any block, select text for the formatting toolbar, or grab the handle on the left to drag blocks around.</p>
<h2>Text blocks</h2>
<ul>
  <li><p>Markdown shortcuts: <code># </code>, <code>- </code>, <code>1. </code>, <code>[] </code>, <code>" </code>, <code>&gt; </code></p></li>
  <li><p><strong>Bold</strong>, <em>italic</em>, <s>strike</s>, <code>inline code</code>, and <a href="https://slasheditor.dev">links</a></p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Install the kit from the shadcn registry</p></li>
  <li data-type="taskItem" data-checked="false"><p>Swap the mock adapters for your own backend</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>Callouts wrap block content in a highlighted aside.</p></div>
<details>
  <summary>Toggle lists collapse content</summary>
  <div data-type="detailsContent"><p>Type <code>&gt; </code> or <code>/toggle</code> to insert one.</p></div>
</details>
<blockquote><p>Every UI piece is source code in <code>components/</code>. You own it.</p></blockquote>
<pre><code>const editor = useSlashEditor({ blockKit: { headingLevels: [1, 2, 3] } })</code></pre>
<h2>Diagrams, media &amp; layout</h2>
<pre data-type="mermaid"><code>flowchart LR
    A[Type /mermaid] --> B{Caret inside?}
    B -->|yes| C[Edit source]
    B -->|no| D[Rendered diagram]</code></pre>
<div data-type="image" data-src="/logo.png" data-status="ready"><img src="/logo.png" alt="slash-editor logo" /></div>
<a data-type="embed" data-mode="bookmark" href="https://tiptap.dev" data-title="Tiptap" data-description="The headless editor framework slash-editor builds on.">Tiptap</a>
<div data-type="columns">
  <div data-type="column"><p>Columns place content side by side.</p></div>
  <div data-type="column"><p>Type <code>/columns</code> to insert a new layout.</p></div>
</div>
<table>
  <tbody>
    <tr><th><p>Block</p></th><th><p>Adapter</p></th></tr>
    <tr><td><p>Image / File / Video</p></td><td><p>UploadAdapter</p></td></tr>
    <tr><td><p>AI block</p></td><td><p>StreamAdapter</p></td></tr>
  </tbody>
</table>
<h2>Mentions, comments &amp; AI</h2>
<p>Type <code>@</code> to mention a teammate: thanks <span data-type="mention" data-id="1">@Ada Lovelace</span>.</p>
<p>Select text and use the comment button in the toolbar to open a thread.</p>
<p>Type <code>/continue-writing</code> or <code>/summarize</code> to stream a mock AI response.</p>
`;

// Declared at module scope so the extension list is stable across renders.
const EXTENSIONS = [...nodeViewExtensions(), markdown()];

/**
 * Full slash-editor setup: every block from the kit, wired to in-memory mock
 * adapters (uploads, AI streaming, mentions, comments). Replace the `lib/*`
 * mocks with real implementations for production.
 */
export function Editor() {
  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore();

  const editor = useDemoEditor({
    content: INITIAL_CONTENT,
    blockKit: {
      image: {},
      file: {},
      video: {},
      embed: {},
      mermaid: {},
      ai: { adapter: mockStreamAdapter, node: false },
      mention: {
        items: (query: string, { signal }: { signal: AbortSignal }) =>
          mockMentionProvider(query, signal),
      },
      comment: { store: storeRef.current },
      extend: EXTENSIONS,
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[60vh] py-10 pr-8 pl-24",
        "aria-label": "Document",
      },
    },
  });

  return (
    <div className="flex items-start gap-6">
      <div className="bg-card border-border focus-within:ring-ring/40 min-w-0 flex-1 rounded-xl border shadow-sm focus-within:ring-2">
        <EditorContent editor={editor} />
        {editor && <SlashMenu editor={editor} />}
        {editor && <MentionMenu editor={editor} />}
        {editor && <BlockHandle editor={editor} />}
        {editor && <BubbleToolbar editor={editor} />}
        {editor && <LinkEditorPopover editor={editor} />}
        {editor && <CommentComposer editor={editor} />}
      </div>
      <aside className="border-border sticky top-6 hidden max-h-[calc(100vh-3rem)] w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l pl-6 lg:flex">
        {editor && <TableOfContents editor={editor} />}
        {editor && <CommentPanel editor={editor} className="w-full border-l-0 p-0" />}
      </aside>
    </div>
  );
}
