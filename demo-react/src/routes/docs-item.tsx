import type { CommentThreadStore } from "@slash-editor/core";
import { EditorContent, useSlashEditor } from "@slash-editor/react";
import { useRef } from "react";
import { Link } from "@/lib/router.tsx";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { CommentPanel } from "@/components/comment-panel.tsx";
import { InstallCommand } from "@/components/install-command.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { PresenceAvatars } from "@/components/presence-avatars.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { createMockCommentThreadStore } from "@/lib/comment-store.ts";
import { createFakePresenceProvider } from "@/lib/fake-presence.ts";
import { mockMentionProvider } from "@/lib/mention-provider.ts";
import { nodeViewExtensions } from "@/lib/node-view-extensions.tsx";
import { addCommand, type RegistryItemMeta } from "@/lib/registry-items.ts";
import { mockStreamAdapter } from "@/lib/stream-adapter.ts";
import { cn } from "@/lib/utils.ts";

const EDITOR_CLASS = "slash-content min-h-40 pl-20 pr-10 py-8";
const CARD_CLASS = cn(
  "bg-card border-border relative rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

function SlashMenuDemo() {
  const editor = useSlashEditor({
    content: "<p>Type <code>/</code> on an empty line to open the menu.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

function BubbleToolbarDemo() {
  const editor = useSlashEditor({
    content: "<p>Select this sentence to see the bubble toolbar appear above it.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <BubbleToolbar editor={editor} />
    </div>
  );
}

function BlockHandleDemo() {
  const editor = useSlashEditor({
    content:
      "<p>Hover just left of a block for the drag/insert handle.</p><p>Try dragging this paragraph above the one before it.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <BlockHandle editor={editor} />
    </div>
  );
}

function MentionMenuDemo() {
  const editor = useSlashEditor({
    content: "<p>Type <code>@</code> to mention a teammate.</p>",
    blockKit: { mention: { items: (query, { signal }) => mockMentionProvider(query, signal) } },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <MentionMenu editor={editor} />
    </div>
  );
}

function LinkEditorDemo() {
  const editor = useSlashEditor({
    content: '<p>Click this <a href="https://prosemirror.net">link</a> to edit or remove it.</p>',
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <LinkEditorPopover editor={editor} />
    </div>
  );
}

function CommentPanelDemo() {
  const storeRef = useRef<CommentThreadStore | null>(null);
  storeRef.current ??= createMockCommentThreadStore();
  const editor = useSlashEditor({
    content: "<p>Select some text in this paragraph, then add a comment from the panel.</p>",
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className="flex items-start gap-4">
      <div className={cn(CARD_CLASS, "min-w-0 flex-1")}>
        <EditorContent editor={editor} />
      </div>
      <CommentPanel editor={editor} store={storeRef.current} />
    </div>
  );
}

function PresenceAvatarsDemo() {
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

function NodeViewsDemo() {
  const editor = useSlashEditor({
    content:
      "<p>Type <code>/image</code>, <code>/file</code>, <code>/video</code>, or <code>/embed</code> to try one.</p>",
    blockKit: {
      image: false,
      file: false,
      video: false,
      embed: false,
      ai: { adapter: mockStreamAdapter, node: false },
      extend: nodeViewExtensions(),
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });
  if (!editor) {
    return null;
  }
  return (
    <div className={CARD_CLASS}>
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}

const DEMOS: Record<string, () => React.ReactElement | null> = {
  "slash-menu": SlashMenuDemo,
  "bubble-toolbar": BubbleToolbarDemo,
  "block-handle": BlockHandleDemo,
  "mention-menu": MentionMenuDemo,
  "link-editor-popover": LinkEditorDemo,
  "comment-panel": CommentPanelDemo,
  "presence-avatars": PresenceAvatarsDemo,
  "node-views": NodeViewsDemo,
};

export function DocsItemPage({ item }: { item: RegistryItemMeta }) {
  const Demo = DEMOS[item.slug];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium tracking-tight">{item.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
      </div>
      <p className="text-muted-foreground text-xs">
        Needs the{" "}
        <Link to="/docs" className="underline">
          registry configured
        </Link>{" "}
        once per project.
      </p>
      <InstallCommand command={addCommand(item.slug)} />
      {Demo && <Demo />}
    </div>
  );
}
