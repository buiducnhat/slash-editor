"use client";

import type { PagesOptions } from "@slash-editor/core";
import { EditorContent } from "@slash-editor/react";
import type { JSONContent } from "@tiptap/core";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { EmojiMenu } from "@/components/emoji-menu.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { PageBacklinks } from "@/components/page-backlinks.tsx";
import { PageBreadcrumb } from "@/components/page-breadcrumb.tsx";
import { focusPageTitle, PageHeader } from "@/components/page-header.tsx";
import { PageTree } from "@/components/page-tree.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { createDemoPageStore, DEMO_ROOT_PAGE_ID, type DemoPageStore } from "@/lib/page-store.ts";
import { nodeViewExtensions, pageNodeViews } from "@/lib/node-view-extensions.tsx";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";
import { cn } from "@/lib/utils.ts";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const SAVE_DELAY_MS = 250;

const EXTENSIONS = nodeViewExtensions();

const EDITOR_CARD = cn(
  "bg-card border-border rounded-xl border shadow-sm",
  "focus-within:ring-ring/40 focus-within:ring-2",
);

const pageUrl = (pageId: string) => `/playground?page=${pageId}`;

/**
 * One page's editor. The parent keys it by `pageId`: extensions and the
 * document are latched once per editor instance, so opening another page
 * means mounting another editor — exactly what a host app does per route.
 */
function PageEditor({
  store,
  pageId,
  onNavigate,
}: {
  store: DemoPageStore;
  pageId: string;
  onNavigate: (pageId: string) => void;
}) {
  // The editor latches its options, so callbacks go through a ref and stay current.
  const navigateRef = useRef(onNavigate);
  navigateRef.current = onNavigate;

  const pagesRef = useRef<PagesOptions | null>(null);
  pagesRef.current ??= {
    store,
    currentPageId: pageId,
    onNavigate: (id) => navigateRef.current(id),
    // Removing the block trashes the page; undo (or a paste back) restores it.
    onSubPagesDetached: (ids) => store.setTrashed(ids, true),
    onSubPagesAttached: (ids) => store.setTrashed(ids, false),
    resolveHref: pageUrl,
    nodeViews: pageNodeViews(),
  };

  // Saves trail the keystroke, and unmounting flushes whatever is pending —
  // `/page` navigates away in the same tick it inserts the block.
  const pending = useRef<{ timer: number; doc: JSONContent } | null>(null);
  const flush = useCallback(() => {
    if (pending.current) {
      clearTimeout(pending.current.timer);
      store.setContent(pageId, pending.current.doc);
      pending.current = null;
    }
  }, [store, pageId]);
  useEffect(() => {
    // Unmount covers navigation; closing or reloading the tab never unmounts React.
    const onLeave = () => flush();

    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onLeave);

    return () => {
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      flush();
    };
  }, [flush]);

  const editor = useDemoEditor({
    content: store.getContent(pageId) ?? EMPTY_DOC,
    blockKit: {
      // `nodeViewExtensions()` registers these with their node views.
      image: false,
      file: false,
      video: false,
      embed: false,
      mermaid: false,
      emoji: {},
      pages: pagesRef.current,
      extend: EXTENSIONS,
    },
    onUpdate: ({ editor: instance }) => {
      if (pending.current) clearTimeout(pending.current.timer);

      pending.current = { timer: window.setTimeout(flush, SAVE_DELAY_MS), doc: instance.getJSON() };
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[50vh] pl-24 pr-8 pb-10 pt-4",
        "aria-label": "Document",
      },
      // ArrowUp from the very first position hands the caret back to the title.
      handleKeyDown: (view, event) => {
        const { selection } = view.state;

        if (event.key === "ArrowUp" && selection.empty && selection.$from.pos <= 1) {
          return focusPageTitle();
        }

        return false;
      },
    },
  });

  return (
    <div className={EDITOR_CARD}>
      <PageHeader store={store} pageId={pageId} editor={editor} className="pl-24 pr-8 pt-10" />
      <EditorContent editor={editor} />
      {editor && <SlashMenu editor={editor} />}
      {editor && <MentionMenu editor={editor} />}
      {editor && <EmojiMenu editor={editor} />}
      {editor && <BlockHandle editor={editor} />}
      {editor && <BubbleToolbar editor={editor} />}
      {editor && <LinkEditorPopover editor={editor} />}
    </div>
  );
}

/**
 * `/playground?page=<id>`: the pages feature end to end against a
 * `localStorage`-backed `PageStore` — sidebar tree, breadcrumb, sub-page
 * blocks, `@` page links, and backlinks. A separate mode from the default
 * playground so its `@` menu and slash list stay the ones the rest of the
 * suite expects.
 */
export function PagesPlayground({ pageId }: { pageId: string }) {
  const router = useRouter();
  const storeRef = useRef<DemoPageStore | null>(null);
  storeRef.current ??= createDemoPageStore();
  const store = storeRef.current;

  const navigate = useCallback((id: string) => router.push(pageUrl(id)), [router]);

  const createRootPage = useCallback(async () => {
    const page = await store.create({ parentId: null });
    navigate(page.id);
  }, [store, navigate]);

  return (
    <div className="mx-auto flex w-full max-w-6xl items-start gap-6">
      <aside className="border-border sticky top-6 w-60 shrink-0 border-r pr-4">
        <button
          type="button"
          onClick={() => router.push("/playground")}
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-xs transition-colors"
        >
          <ArrowLeftIcon className="size-3" aria-hidden />
          Back to playground
        </button>
        <PageTree
          store={store}
          activePageId={pageId}
          defaultExpanded={[DEMO_ROOT_PAGE_ID]}
          onNavigate={navigate}
          onCreate={createRootPage}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <PageBreadcrumb store={store} pageId={pageId} onNavigate={navigate} />
        <PageEditor key={pageId} store={store} pageId={pageId} onNavigate={navigate} />
        <PageBacklinks store={store} pageId={pageId} onNavigate={navigate} />
      </div>
    </div>
  );
}
