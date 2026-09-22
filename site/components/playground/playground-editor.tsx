"use client";

import type { CommentThreadStore } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorContent, useEditorState } from "@slash-editor/react";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, UsersIcon } from "lucide-react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentPanel } from "@/components/comment-panel.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { PresenceAvatars } from "@/components/presence-avatars.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { type DemoCollaboration, createDemoCollaboration } from "@/lib/collaboration.ts";
import { createMockCommentThreadStore } from "@/lib/comment-store.ts";
import { mockMentionProvider } from "@/lib/mention-provider.ts";
import { nodeViewExtensions } from "@/lib/node-view-extensions.tsx";
import { mockStreamAdapter } from "@/lib/stream-adapter.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { cn } from "@/lib/utils.ts";

const INITIAL_CONTENT = `
<h1>slash-editor</h1>
<p>Notion-style block editing on a headless core, styled with shadcn tokens.</p>
<h2>Baseline schema</h2>
<ul>
  <li><p>Headings, lists, quotes, code, rules</p></li>
  <li><p>Markdown input rules: type <code># </code>, <code>- </code>, <code>&gt; </code> for a toggle, or <code>" </code> for a quote</p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Ship the slash menu</p></li>
  <li data-type="taskItem" data-checked="false"><p>Ship callout, toggle, and task-list nodes</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>Callouts wrap block content in a highlighted aside.</p></div>
<details>
  <summary>Toggle lists collapse content</summary>
  <div data-type="detailsContent"><p>Type <code>&gt; </code> or <code>/toggle</code> to insert one.</p></div>
</details>
<details data-level="2">
  <summary>Toggle headings collapse a section</summary>
  <div data-type="detailsContent"><p>Type <code># </code> then <code>&gt; </code>, or <code>## </code> inside a toggle's title.</p></div>
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

const EDITOR_CARD = cn(
  "bg-card border-border rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

const BLOCK_KIT_DEFAULTS = {
  image: false,
  file: false,
  video: false,
  embed: false,
  ai: { adapter: mockStreamAdapter, node: false },
  mention: {
    items: (query: string, { signal }: { signal: AbortSignal }) =>
      mockMentionProvider(query, signal),
  },
  extend: nodeViewExtensions(),
} as const;

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Offline",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  disconnected: "bg-destructive",
};

/**
 * Live connection state off the `HocuspocusProvider` itself — there is no
 * hosted collab server for this public deployment, so a visitor's first
 * `?collab=<room>` attempt reaches nothing until they run
 * `bun run collab:server` themselves (or point `NEXT_PUBLIC_COLLAB_SERVER_URL`
 * at their own). Surfacing the real status turns that into a legible
 * "Offline" state instead of a silently empty document that looks broken.
 */
function useConnectionStatus(provider: HocuspocusProvider): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    (provider.configuration.websocketProvider.status as ConnectionStatus | undefined) ??
      "connecting",
  );

  useEffect(() => {
    // The connection may already have transitioned (even to "connected")
    // between the initial render and this effect attaching — a status
    // change that fires in that window would otherwise be missed, since
    // each transition only emits once.
    setStatus(provider.configuration.websocketProvider.status as ConnectionStatus);
    const handleStatus = ({ status }: { status: ConnectionStatus }) => setStatus(status);
    provider.on("status", handleStatus);
    return () => {
      provider.off("status", handleStatus);
    };
  }, [provider]);

  return status;
}

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

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

/** Joins (or switches) a collaborative room by pushing `?collab=<room>` onto the URL. */
function RoomJoinForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const room = value.trim();
    if (!room) return;
    router.push(`/playground?collab=${encodeURIComponent(room)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <UsersIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Room name"
        aria-label="Collaboration room name"
        className="border-input bg-background placeholder:text-muted-foreground h-8 w-32 rounded-md border px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-40"
      />
      <button
        type="submit"
        className="bg-primary text-primary-foreground h-8 shrink-0 rounded-md px-3 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Join
      </button>
    </form>
  );
}

function SoloEditor() {
  const editor = useDemoEditor({
    content: INITIAL_CONTENT,
    blockKit: BLOCK_KIT_DEFAULTS,
    editorProps: {
      attributes: { class: "slash-content min-h-[60vh] px-8 py-10", "aria-label": "Document" },
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Playground</h1>
          <p className="text-muted-foreground text-sm">
            A live, editable instance — every block, the slash menu, and inline formatting.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {editor && <DocumentStats editor={editor} />}
          <RoomJoinForm />
        </div>
      </header>

      <div className={EDITOR_CARD}>
        <EditorContent editor={editor} />
        {editor && <SlashMenu editor={editor} />}
        {editor && <MentionMenu editor={editor} />}
        {editor && <BlockHandle editor={editor} />}
        {editor && <BubbleToolbar editor={editor} />}
        {editor && <LinkEditorPopover editor={editor} />}
      </div>
    </div>
  );
}

/**
 * `?collab=<room>` opt-in path: wires a shared `Y.Doc` + `HocuspocusProvider`
 * (the self-host recipe in `server/collab-server.ts`) into the same block
 * kit `SoloEditor` uses, so the collaborative editor is otherwise identical —
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
function CollabEditor({ room }: { room: string }) {
  const router = useRouter();
  const collabRef = useRef<DemoCollaboration | null>(null);
  collabRef.current ??= createDemoCollaboration(room);
  const collab = collabRef.current;
  const status = useConnectionStatus(collab.provider);

  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore(collab.user.name);
  const store = storeRef.current;

  const editor = useDemoEditor({
    blockKit: {
      ...BLOCK_KIT_DEFAULTS,
      collaboration: { document: collab.document, provider: collab.provider, user: collab.user },
    },
    editorProps: {
      attributes: { class: "slash-content min-h-[60vh] px-8 py-10", "aria-label": "Document" },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-6">
      <div className="min-w-0 flex-1">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/playground")}
              className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-xs transition-colors"
            >
              <ArrowLeftIcon className="size-3" aria-hidden />
              Leave room
            </button>
            <h1 className="text-lg font-semibold tracking-tight">Room “{room}”</h1>
          </div>
          <div className="flex items-center gap-3">
            {editor && <DocumentStats editor={editor} />}
            <ConnectionStatusBadge status={status} />
            <PresenceAvatars provider={collab.provider} />
          </div>
        </header>

        {status === "disconnected" ? (
          <p className="text-muted-foreground mb-4 text-sm">
            Can't reach a collaboration server — this demo is self-hosted, not free hosting. Run{" "}
            <code className="bg-muted rounded px-1 py-0.5">bun run collab:server</code> locally, or
            point{" "}
            <code className="bg-muted rounded px-1 py-0.5">NEXT_PUBLIC_COLLAB_SERVER_URL</code> at
            your own. See the{" "}
            <Link href="/docs/guides/collaboration" className="text-primary underline">
              collaboration guide
            </Link>
            .
          </p>
        ) : null}

        <div className={EDITOR_CARD}>
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
  );
}

export function PlaygroundEditor() {
  const searchParams = useSearchParams();
  const room = searchParams.get("collab");
  return room ? <CollabEditor key={room} room={room} /> : <SoloEditor />;
}
