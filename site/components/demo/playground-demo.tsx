"use client";

import type { CommentThreadStore } from "@slash-editor/core";
import { EditorContent } from "@slash-editor/react";
import { useRef } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentComposer } from "@/components/comment-composer.tsx";
import { EmojiMenu } from "@/components/emoji-menu.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { createMockCommentThreadStore } from "@/lib/comment-store.ts";
import { mockMentionProvider } from "@/lib/mention-provider.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { cn } from "@/lib/utils.ts";

const CARD_CLASS = cn(
  "bg-card border-border relative rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

/** Full playground demo with all block controls for the homepage. */
export function PlaygroundDemo() {
  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore();
  const store = storeRef.current;

  const editor = useDemoEditor({
    editable: true,
    content: `<h1>Welcome to slash-editor</h1>
<p>This is a live editor demo. Try typing <code>/</code> on an empty line to open the slash menu.</p>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="false"><p>Hover left of blocks for the drag handle</p></li>
<li data-type="taskItem" data-checked="false"><p>Select text for the bubble toolbar</p></li>
</ul>
<blockquote><p>Built on Tiptap + shadcn/ui</p></blockquote>`,
    blockKit: {
      emoji: {},
      mention: {
        items: (query: string, { signal }: { signal: AbortSignal }) =>
          mockMentionProvider(query, signal),
      },
      comment: { store },
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[50vh] pl-24 pr-8 py-8",
        "aria-label": "Interactive demo",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
      <MentionMenu editor={editor} />
      <EmojiMenu editor={editor} />
      <BlockHandle editor={editor} />
      <BubbleToolbar editor={editor} />
      <LinkEditorPopover editor={editor} />
      <CommentComposer editor={editor} />
    </div>
  );
}
