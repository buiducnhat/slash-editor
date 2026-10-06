"use client";

import { EditorContent, useEditorState } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { EyeIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentComposer } from "@/components/comment-composer.tsx";
import { CommentPanel } from "@/components/comment-panel.tsx";
import { EmojiMenu } from "@/components/emoji-menu.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { TableOfContents } from "@/components/table-of-contents.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

export const EDITOR_CARD = cn(
  "bg-card border-border rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

/**
 * The editor and every floating surface that hangs off it. Each menu renders
 * nothing until its extension asks for it, so mounting one for a feature the
 * editor doesn't have is harmless.
 */
export function EditorSurface({
  editor,
  comments = true,
  className,
}: {
  editor: Editor | null;
  /** Mount the comment composer; requires `blockKit.comment`. */
  comments?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(EDITOR_CARD, className)}>
      <EditorContent editor={editor} />
      {editor && <SlashMenu editor={editor} />}
      {editor && <MentionMenu editor={editor} />}
      {editor && <EmojiMenu editor={editor} />}
      {editor && <BlockHandle editor={editor} />}
      {editor && <BubbleToolbar editor={editor} />}
      {editor && <LinkEditorPopover editor={editor} />}
      {editor && comments && <CommentComposer editor={editor} />}
    </div>
  );
}

/**
 * The editor card plus a sticky rail with the outline and (optionally) the
 * comment panel. The rail hides below `lg`, where the card gets the full width.
 */
export function EditorWorkspace({
  editor,
  comments = true,
  footer,
  className,
}: {
  editor: Editor | null;
  comments?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-6", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <EditorSurface editor={editor} comments={comments} />
        {footer}
      </div>
      <aside className="border-border sticky top-20 hidden max-h-[calc(100vh-6rem)] w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l pl-6 lg:flex">
        {editor && <TableOfContents editor={editor} />}
        {editor && comments && <CommentPanel editor={editor} className="w-full border-l-0 p-0" />}
      </aside>
    </div>
  );
}

/**
 * Read-only switch for a running editor. `setEditable` is per tab rather than
 * per document, so a collaborator can flip into a reader's view without
 * affecting anyone else.
 */
export function useReadOnly(editor: Editor | null, initial = false) {
  const [readOnly, setReadOnly] = useState(initial);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  return [readOnly, setReadOnly] as const;
}

export function ReadOnlyToggle({
  readOnly,
  onChange,
}: {
  readOnly: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Button
      variant={readOnly ? "secondary" : "outline"}
      size="sm"
      aria-pressed={readOnly}
      onClick={() => onChange(!readOnly)}
    >
      <EyeIcon data-icon="inline-start" />
      Read-only
    </Button>
  );
}

/** Live block and word count; render it only once the editor exists. */
export function DocumentStats({ editor }: { editor: Editor }) {
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
