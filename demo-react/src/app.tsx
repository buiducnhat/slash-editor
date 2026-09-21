import type { CommentThreadStore } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditorState, useSlashEditor } from "@slash-editor/react";
import { useRef } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentPanel } from "@/components/comment-panel.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { PresenceAvatars } from "@/components/presence-avatars.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { TopNav } from "@/components/top-nav.tsx";
import { type DemoCollaboration, createDemoCollaboration } from "@/lib/collaboration.ts";
import { createMockCommentThreadStore } from "@/lib/comment-store.ts";
import { mockMentionProvider } from "@/lib/mention-provider.ts";
import { nodeViewExtensions } from "@/lib/node-view-extensions.tsx";
import { usePathname } from "@/lib/router.tsx";
import { mockStreamAdapter } from "@/lib/stream-adapter.ts";
import { cn } from "@/lib/utils.ts";
import { DocsApp } from "@/routes/docs-app.tsx";

const INITIAL_CONTENT = `
<h1>slash-editor</h1>
<p>Notion-style block editing on a headless core, styled with shadcn tokens.</p>
<h2>Baseline schema</h2>
<ul>
  <li><p>Headings, lists, quotes, code, rules</p></li>
  <li><p>Markdown input rules: type <code># </code>, <code>- </code>, or <code>&gt; </code></p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Ship the slash menu</p></li>
  <li data-type="taskItem" data-checked="false"><p>Ship callout, toggle, and task-list nodes</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>Callouts wrap block content in a highlighted aside.</p></div>
<details>
  <summary>Toggle lists collapse content</summary>
  <div data-type="detailsContent"><p>Type <code>/toggle</code> to insert one.</p></div>
</details>
<blockquote><p>Type <code>/</code> on an empty line to open the block menu.</p></blockquote>
<pre><code>const editor = useSlashEditor({ blockKit: { headingLevels: [1, 2, 3] } })</code></pre>
<h2>Media &amp; structure</h2>
<p>Type <code>/image</code>, <code>/file</code>, or <code>/video</code> for an upload placeholder with retry on failure.</p>
<a data-type="embed" data-mode="bookmark" href="https://tiptap.dev" data-title="Tiptap" data-description="The headless editor framework this project builds on.">Tiptap</a>
<div data-type="columns">
  <div data-type="column"><p>Columns are a container node: side-by-side content that still nests through the same drag/drop rules as lists.</p></div>
  <div data-type="column"><p>Type <code>/columns</code> to insert a new side-by-side layout.</p></div>
</div>
<h2>Mentions, links &amp; AI</h2>
<p>Type <code>@</code> to mention a teammate: cc <span data-type="mention" data-id="1">@Ada Lovelace</span> — thanks!</p>
<p>Click this <a href="https://prosemirror.net">link</a> to edit or remove it inline.</p>
<p>Type <code>/continue-writing</code>, <code>/summarize</code>, <code>/brainstorm-ideas</code>, or <code>/fix-spelling-grammar</code> to stream an AI response through a mock <code>StreamAdapter</code>.</p>
<table>
  <tbody>
    <tr><th><p>Node</p></th><th><p>Adapter</p></th></tr>
    <tr><td><p>Image / File / Video</p></td><td><p>UploadAdapter</p></td></tr>
    <tr><td><p>Embed</p></td><td><p>None — direct URL</p></td></tr>
  </tbody>
</table>
`;

/** Rendered only once the editor exists, so the stats subscribe to a live instance. */
function DocumentStats({ editor }: { editor: Editor }) {
  const stats = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      words: instance.getText().split(/\s+/).filter(Boolean).length,
      blocks: instance.state.doc.childCount,
    }),
  });

  return (
    <p className="text-muted-foreground text-xs tabular-nums">
      {stats.blocks} blocks · {stats.words} words
    </p>
  );
}

function SoloApp() {
  const editor = useSlashEditor({
    content: INITIAL_CONTENT,
    blockKit: {
      image: false,
      file: false,
      video: false,
      embed: false,
      ai: { adapter: mockStreamAdapter, node: false },
      mention: {
        items: (query, { signal }) => mockMentionProvider(query, signal),
      },
      extend: nodeViewExtensions(),
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[60vh] pl-20 pr-10 py-8",
        "aria-label": "Document",
      },
    },
  });

  return (
    <main className="bg-background min-h-screen py-12">
      <div className="mx-auto w-full max-w-3xl px-6">
        <TopNav />
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-sm font-medium tracking-tight">slash-editor playground</h1>
          {editor && <DocumentStats editor={editor} />}
        </header>

        <div
          className={cn(
            "bg-card border-border rounded-xl border shadow-sm",
            "focus-within:ring-ring/40 focus-within:ring-2",
          )}
        >
          <EditorContent editor={editor} />
          {editor && <SlashMenu editor={editor} />}
          {editor && <MentionMenu editor={editor} />}
          {editor && <BlockHandle editor={editor} />}
          {editor && <BubbleToolbar editor={editor} />}
          {editor && <LinkEditorPopover editor={editor} />}
        </div>
      </div>
    </main>
  );
}

/**
 * `?collab=<room>` opt-in path: wires a shared `Y.Doc` + `HocuspocusProvider`
 * (the self-host recipe in `server/collab-server.ts`) into the same block
 * kit `SoloApp` uses, so the collaborative editor is otherwise identical —
 * plus presence avatars and a comment sidebar.
 *
 * `collab`/`store` are created eagerly during render, guarded by a ref the
 * same way `useSlashEditor` latches its own extensions: `blockKit` is only
 * ever read on the first render, so the provider must exist before that
 * call, not after it in an effect. Neither is torn down on unmount — like
 * any other browser tab leaving a room, the connection closes when the
 * page does, and the server (`collab-server.ts`) already treats that as a
 * normal disconnect.
 */
function CollabApp({ room }: { room: string }) {
  const collabRef = useRef<DemoCollaboration | null>(null);
  collabRef.current ??= createDemoCollaboration(room);
  const collab = collabRef.current;

  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore(collab.user.name);
  const store = storeRef.current;

  const editor = useSlashEditor({
    blockKit: {
      image: false,
      file: false,
      video: false,
      embed: false,
      ai: { adapter: mockStreamAdapter, node: false },
      mention: {
        items: (query, { signal }) => mockMentionProvider(query, signal),
      },
      collaboration: { document: collab.document, provider: collab.provider, user: collab.user },
      extend: nodeViewExtensions(),
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[60vh] pl-20 pr-10 py-8",
        "aria-label": "Document",
      },
    },
  });

  return (
    <main className="bg-background min-h-screen py-12">
      <div className="mx-auto flex w-full max-w-5xl gap-6 px-6">
        <div className="min-w-0 flex-1">
          <TopNav />
          <header className="mb-6 flex items-baseline justify-between">
            <h1 className="text-sm font-medium tracking-tight">
              slash-editor playground — room “{room}”
            </h1>
            <div className="flex items-center gap-3">
              {editor && <DocumentStats editor={editor} />}
              <PresenceAvatars provider={collab.provider} />
            </div>
          </header>

          <div
            className={cn(
              "bg-card border-border rounded-xl border shadow-sm",
              "focus-within:ring-ring/40 focus-within:ring-2",
            )}
          >
            <EditorContent editor={editor} />
            {editor && <SlashMenu editor={editor} />}
            {editor && <MentionMenu editor={editor} />}
            {editor && <BlockHandle editor={editor} />}
            {editor && <BubbleToolbar editor={editor} />}
            {editor && <LinkEditorPopover editor={editor} />}
          </div>
        </div>
        {editor && <CommentPanel editor={editor} store={store} />}
      </div>
    </main>
  );
}

function readCollabRoom(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("collab");
}

export function App() {
  const pathname = usePathname();
  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    return <DocsApp pathname={pathname} />;
  }
  const room = readCollabRoom();
  return room ? <CollabApp key={room} room={room} /> : <SoloApp />;
}
