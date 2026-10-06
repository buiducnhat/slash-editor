"use client";

import { EditorContent, useEditorState } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { CheckIcon, ClockIcon, DownloadIcon, LinkIcon, PencilIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { EditorSurface, useReadOnly } from "@/components/editor-surface.tsx";
import { TableOfContents } from "@/components/table-of-contents.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ARTICLE_CONTENT } from "@/lib/article-content.ts";
import { BLOCK_KIT } from "@/lib/editor-kit.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const WORDS_PER_MINUTE = 220;
const COPIED_MS = 1800;

function ReadingTime({ editor }: { editor: Editor }) {
  const minutes = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      const words = instance.getText().split(/\s+/).filter(Boolean).length;

      return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
    },
  });

  return (
    <span className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs tabular-nums">
      <ClockIcon className="size-3.5" aria-hidden />
      {minutes} min read
    </span>
  );
}

function downloadMarkdown(editor: Editor) {
  const url = URL.createObjectURL(new Blob([editor.getMarkdown()], { type: "text/markdown" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = "article.md";
  link.click();
  URL.revokeObjectURL(url);
}

export function ReadOnlyArticle() {
  const editor = useDemoEditor({
    content: ARTICLE_CONTENT,
    // Created read-only: `useReadOnly` flips the same instance for the edit toggle.
    editable: false,
    blockKit: {
      ...BLOCK_KIT,
      // A reader wants links to navigate rather than select.
      link: { openOnClick: true },
      // Checkboxes stay clickable for a reader; nothing is persisted here, so a
      // host that wants the state saves it from this callback.
      taskItem: { onReadOnlyChecked: () => true },
    },
    editorProps: { attributes: { class: "slash-content", "aria-label": "Article" } },
  });
  const [readOnly, setReadOnly] = useReadOnly(editor, true);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <DemoHeader
        title="Read-only article"
        description={
          readOnly
            ? "A published view: links navigate, checkboxes and toggles still respond, and the slash menu, block handle and toolbar are gone."
            : "Editing: every surface is back. Changes live in this tab only."
        }
        actions={
          <>
            <Button
              variant={readOnly ? "outline" : "secondary"}
              size="sm"
              aria-pressed={!readOnly}
              onClick={() => setReadOnly(!readOnly)}
            >
              <PencilIcon data-icon="inline-start" />
              {readOnly ? "Edit this article" : "Done editing"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!editor}
              onClick={() => editor && downloadMarkdown(editor)}
            >
              <DownloadIcon data-icon="inline-start" />
              Download markdown
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <LinkIcon data-icon="inline-start" />
              )}
              <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
            </Button>
            {editor && <ReadingTime editor={editor} />}
          </>
        }
      />
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          {readOnly ? (
            <article className="mx-auto max-w-3xl py-4">
              <EditorContent editor={editor} />
            </article>
          ) : (
            <EditorSurface
              editor={editor}
              comments={false}
              className="[&_.slash-content]:min-h-[60vh] [&_.slash-content]:py-10 [&_.slash-content]:pr-8 [&_.slash-content]:pl-24"
            />
          )}
        </div>
        <aside className="border-border sticky top-20 hidden max-h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-l pl-6 lg:block">
          {editor && <TableOfContents editor={editor} />}
        </aside>
      </div>
    </>
  );
}
