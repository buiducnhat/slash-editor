"use client";

import type { CommentThreadStore } from "@slash-editor/core";
import { useRef, useState } from "react";
import { FileCodeIcon, RotateCcwIcon } from "lucide-react";
import { DemoHeader } from "@/components/demo-header.tsx";
import {
  DocumentStats,
  EditorWorkspace,
  ReadOnlyToggle,
  useReadOnly,
} from "@/components/editor-surface.tsx";
import { MarkdownPanel } from "@/components/markdown-panel.tsx";
import { Button } from "@/components/ui/button.tsx";
import { createCommentThreadStore } from "@/lib/comment-store.ts";
import { BLOCK_KIT, EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { FULL_EDITOR_CONTENT } from "@/lib/sample-content.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { useStoredDocument } from "@/lib/use-stored-document.ts";

const DOCUMENT_KEY = "slash-editor-starter:editor:document";
const COMMENTS_KEY = "slash-editor-starter:editor:comments";
const SAVE_DELAY_MS = 400;

function Skeleton() {
  return (
    <div className="bg-card border-border min-h-[60vh] animate-pulse rounded-xl border" aria-hidden />
  );
}

/** The saved document is read after mount, so the editor itself waits for it. */
export function FullEditor() {
  const { loaded, content, save, clear } = useStoredDocument(DOCUMENT_KEY);

  return loaded ? <Workspace initial={content} save={save} clear={clear} /> : <Skeleton />;
}

type Status = "saved" | "saving";

function Workspace({
  initial,
  save,
  clear,
}: {
  initial: ReturnType<typeof useStoredDocument>["content"];
  save: ReturnType<typeof useStoredDocument>["save"];
  clear: ReturnType<typeof useStoredDocument>["clear"];
}) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [status, setStatus] = useState<Status>("saved");
  const timer = useRef<number | undefined>(undefined);

  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createCommentThreadStore({ storageKey: COMMENTS_KEY });

  const editor = useDemoEditor({
    content: initial ?? FULL_EDITOR_CONTENT,
    blockKit: { ...BLOCK_KIT, comment: { store: storeRef.current } },
    onUpdate: ({ editor: instance }) => {
      setStatus("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        save(instance.getJSON());
        setStatus("saved");
      }, SAVE_DELAY_MS);
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  const [readOnly, setReadOnly] = useReadOnly(editor);

  function reset() {
    window.clearTimeout(timer.current);
    clear();
    try {
      localStorage.removeItem(COMMENTS_KEY);
    } catch {
      // Storage unavailable: nothing was persisted anyway.
    }
    // Threads are held in memory by the store, so reload to drop them with the anchors.
    window.location.reload();
  }

  return (
    <>
      <DemoHeader
        title="Full editor"
        description={
          readOnly
            ? "Read-only: editing surfaces stand down, links still navigate."
            : "Type / on an empty line for blocks, @ for people, : for emoji, or select text to format or comment. Your changes autosave to this browser."
        }
        actions={
          <>
            <Button
              variant={showMarkdown ? "secondary" : "outline"}
              size="sm"
              aria-pressed={showMarkdown}
              onClick={() => setShowMarkdown((shown) => !shown)}
            >
              <FileCodeIcon data-icon="inline-start" />
              Markdown
            </Button>
            <ReadOnlyToggle readOnly={readOnly} onChange={setReadOnly} />
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcwIcon data-icon="inline-start" />
              Reset
            </Button>
            <span className="text-muted-foreground ml-auto flex items-center gap-3 text-xs">
              {editor && <DocumentStats editor={editor} />}
              <span aria-live="polite">{status === "saving" ? "Saving…" : "Saved"}</span>
            </span>
          </>
        }
      />
      <EditorWorkspace
        editor={editor}
        footer={editor && showMarkdown ? <MarkdownPanel editor={editor} /> : null}
      />
    </>
  );
}
