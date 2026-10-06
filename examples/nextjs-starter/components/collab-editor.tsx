"use client";

import type { CommentThreadStore } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { ArrowLeftIcon, CheckIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { WebrtcProvider } from "y-webrtc";
import { DemoHeader } from "@/components/demo-header.tsx";
import {
  DocumentStats,
  EditorWorkspace,
  ReadOnlyToggle,
  useReadOnly,
} from "@/components/editor-surface.tsx";
import { PresenceAvatars } from "@/components/presence-avatars.tsx";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { createCommentThreadStore } from "@/lib/comment-store.ts";
import type { Collaboration } from "@/lib/collaboration.ts";
import { BLOCK_KIT, EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { cn } from "@/lib/utils.ts";

/** Shown to whoever opens an empty room first. */
const WELCOME_CONTENT = `
<h1>Welcome to the room</h1>
<p>Open this page in a second tab: your carets, selections and edits appear in both. Type <code>/</code> for blocks.</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Join a room</p></li>
  <li data-type="taskItem" data-checked="false"><p>Edit from two tabs at once</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>The document lives in a Yjs doc shared peer to peer: there is no server to run.</p></div>
`;

/**
 * How long a fresh editor waits for a peer to hand over the room's content
 * before deciding the room is empty. Same-browser sync over BroadcastChannel
 * lands in milliseconds; WebRTC peers need a little longer.
 */
const SEED_DELAY_MS = 600;

/**
 * Writes the welcome document into a room nobody has written to yet. The
 * `seeded` flag lives in the doc, so a room that was seeded and later cleared
 * stays empty for everyone who joins afterwards.
 */
function useSeedWelcome(editor: Editor | null, session: Collaboration) {
  useEffect(() => {
    if (!editor) return;

    const timer = window.setTimeout(() => {
      const meta = session.document.getMap("meta");
      // The sync layer writes an empty paragraph into a new room, so ask the editor, not the fragment.
      if (meta.get("seeded") || !editor.isEmpty) return;

      editor.commands.setContent(WELCOME_CONTENT);
      meta.set("seeded", true);
    }, SEED_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [editor, session.document]);
}

/**
 * Live peer count off the `WebrtcProvider` itself. Peers find each other over
 * BroadcastChannel (same browser) or signaling (other devices); being alone
 * in a room just means nobody else joined, not that something broke.
 */
function usePeerCount(provider: WebrtcProvider): number {
  const [peerCount, setPeerCount] = useState(0);

  useEffect(() => {
    const read = () => (provider.room?.webrtcConns.size ?? 0) + (provider.room?.bcConns.size ?? 0);

    // The room may already have peers by the time this attaches.
    setPeerCount(read());
    const handlePeers = ({ webrtcPeers, bcPeers }: { webrtcPeers: string[]; bcPeers: string[] }) =>
      setPeerCount(webrtcPeers.length + bcPeers.length);
    provider.on("peers", handlePeers);

    return () => {
      provider.off("peers", handlePeers);
    };
  }, [provider]);

  return peerCount;
}

function ConnectionBadge({ peerCount }: { peerCount: number }) {
  return (
    <span
      className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
      aria-live="polite"
    >
      <span
        className={cn("size-1.5 rounded-full", peerCount > 0 ? "bg-emerald-500" : "bg-amber-500")}
        aria-hidden
      />
      {peerCount > 0
        ? `Synced with ${peerCount} peer${peerCount === 1 ? "" : "s"}`
        : "Waiting for others…"}
    </span>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function copy() {
    navigator.clipboard.writeText(window.location.href).then(
      () => setCopied(true),
      () => {
        // Clipboard blocked: the link is still in the address bar.
      },
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

const HOCUSPOCUS_SNIPPET = `import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
// or: import { WebsocketProvider } from "y-websocket";

const document = new Y.Doc();
const provider = new HocuspocusProvider({ url: "wss://collab.example.com", name: room, document });
// y-websocket: new WebsocketProvider("wss://collab.example.com", room, document)

useDemoEditor({
  blockKit: { ...BLOCK_KIT, collaboration: { document, provider, user } },
});`;

/** The rest of the setup, tucked under the editor so it doesn't compete with it. */
function SetupNotes() {
  return (
    <details className="bg-card border-border rounded-xl border p-4 text-sm">
      <summary className="cursor-pointer font-medium">Use a server instead of WebRTC</summary>
      <div className="text-muted-foreground mt-3 flex flex-col gap-3">
        <p>
          This room is peer to peer through <code>y-webrtc</code>. With no signaling server, tabs of
          the same browser sync over BroadcastChannel. For other devices, run{" "}
          <code>npx y-webrtc-signaling</code> and set{" "}
          <code>NEXT_PUBLIC_WEBRTC_SIGNALING_URL=ws://localhost:4444</code> (comma-separated for
          several). Only connection setup goes through it; edits flow directly between browsers.
        </p>
        <p>
          WebRTC is a full mesh, so it suits a handful of editors. For larger rooms or restrictive
          networks, swap the provider in <code>lib/collaboration.ts</code>; the editor only needs a
          Yjs document and anything with an awareness field:
        </p>
        <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-3 text-xs">
          <code>{HOCUSPOCUS_SNIPPET}</code>
        </pre>
        <p>
          Comment threads live in the comment store, not the Yjs document: here it is per browser,
          so back it with your database to share threads between people.
        </p>
      </div>
    </details>
  );
}

export function CollabEditor({ room, session }: { room: string; session: Collaboration }) {
  const { document, provider, user } = session;
  const peerCount = usePeerCount(provider);

  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createCommentThreadStore({
    author: user.name,
    storageKey: `slash-editor-starter:collab:${room}:comments`,
  });

  // Undo/redo belongs to Yjs: the kit turns its own history off when `collaboration` is set.
  const editor = useDemoEditor({
    blockKit: {
      ...BLOCK_KIT,
      collaboration: { document, provider, user },
      comment: { store: storeRef.current },
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  // Per tab, not per document: other collaborators stay editable.
  const [readOnly, setReadOnly] = useReadOnly(editor);
  useSeedWelcome(editor, session);

  return (
    <>
      <DemoHeader
        title={`Room “${room}”`}
        description={
          peerCount === 0
            ? "You're the only one here. Open this page in another tab, or copy the link, to see live sync."
            : "Edits, carets and selections sync live between everyone in the room."
        }
        actions={
          <>
            <Link href="/collab" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <ArrowLeftIcon data-icon="inline-start" />
              Rooms
            </Link>
            <CopyLinkButton />
            <ReadOnlyToggle readOnly={readOnly} onChange={setReadOnly} />
            <div className="ml-auto flex items-center gap-3">
              {editor && <DocumentStats editor={editor} />}
              <ConnectionBadge peerCount={peerCount} />
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: user.color }}
                  aria-hidden
                />
                You are {user.name}
              </span>
              <PresenceAvatars provider={provider} />
            </div>
          </>
        }
      />
      <EditorWorkspace editor={editor} footer={<SetupNotes />} />
    </>
  );
}
