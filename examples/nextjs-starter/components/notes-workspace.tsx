"use client";

import type { PagesOptions } from "@slash-editor/core";
import { emoji } from "@slash-editor/core/emoji";
import { EditorContent, usePage } from "@slash-editor/react";
import type { JSONContent } from "@tiptap/core";
import { RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { DemoHeader } from "@/components/demo-header.tsx";
import { EDITOR_CARD } from "@/components/editor-surface.tsx";
import { EmojiMenu } from "@/components/emoji-menu.tsx";
import { LinkEditorPopover } from "@/components/link-editor-popover.tsx";
import { MentionMenu } from "@/components/mention-menu.tsx";
import { PageBacklinks } from "@/components/page-backlinks.tsx";
import { PageBreadcrumb } from "@/components/page-breadcrumb.tsx";
import { focusPageTitle, PageHeader } from "@/components/page-header.tsx";
import { PageTree } from "@/components/page-tree.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { Button } from "@/components/ui/button.tsx";
import { nodeViewExtensions, pageNodeViews } from "@/lib/node-view-extensions.tsx";
import {
  createDemoPageStore,
  DEMO_ROOT_PAGE_ID,
  PAGES_STORAGE_KEY,
  type DemoPageStore,
} from "@/lib/page-store.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const SAVE_DELAY_MS = 250;
const EXTENSIONS = nodeViewExtensions();

const pageUrl = (pageId: string) => `/notes/${pageId}`;

/**
 * One store per browser tab, created on first use after mount: it reads
 * `localStorage`, so it can't exist during server rendering, and it must
 * survive navigation between pages (and Strict Mode's double effect).
 */
let sharedStore: DemoPageStore | undefined;

function getPageStore(): DemoPageStore {
  sharedStore ??= createDemoPageStore();

  return sharedStore;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start" aria-hidden>
      <div className="bg-card border-border h-40 animate-pulse rounded-xl border md:w-60 md:shrink-0" />
      <div className="bg-card border-border min-h-[60vh] flex-1 animate-pulse rounded-xl border" />
    </div>
  );
}

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
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
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
      codeBlock: false,
      emoji: emoji(),
      pages: pagesRef.current,
      extend: EXTENSIONS,
    },
    onUpdate: ({ editor: instance }) => {
      if (pending.current) clearTimeout(pending.current.timer);

      pending.current = { timer: window.setTimeout(flush, SAVE_DELAY_MS), doc: instance.getJSON() };
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[50vh] pb-10 pt-4 pr-8 pl-24",
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
      <PageHeader store={store} pageId={pageId} editor={editor} className="pt-10 pr-8 pl-24" />
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

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border-border flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{children}</p>
    </div>
  );
}

/** The page body: the editor when the page exists, otherwise the matching empty state. */
function PageView({
  store,
  pageId,
  navigate,
}: {
  store: DemoPageStore;
  pageId: string;
  navigate: (pageId: string) => void;
}) {
  const { page, status } = usePage(store, pageId);

  if (status === "loading") {
    return <div className="bg-card border-border min-h-[60vh] animate-pulse rounded-xl border" />;
  }

  if (!page) {
    return (
      <Notice title="Page not found">
        This page doesn&apos;t exist in this workspace.{" "}
        <Link href={pageUrl(DEMO_ROOT_PAGE_ID)} className="text-foreground underline">
          Go to Home
        </Link>
      </Notice>
    );
  }

  if (page.trashed) {
    return (
      <Notice title="This page is in the trash">
        It was removed from its parent. Restore it to edit it again.
        <span className="mt-4 flex justify-center">
          <Button size="sm" onClick={() => store.setTrashed([pageId], false)}>
            Restore page
          </Button>
        </span>
      </Notice>
    );
  }

  return (
    <>
      <PageEditor key={pageId} store={store} pageId={pageId} onNavigate={navigate} />
      <PageBacklinks store={store} pageId={pageId} onNavigate={navigate} />
    </>
  );
}

/**
 * `/notes/<pageId>`: the pages feature end to end against a
 * `localStorage`-backed `PageStore` — sidebar tree, breadcrumb, sub-page
 * blocks, `@` page links, and backlinks.
 */
export function NotesWorkspace({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [store, setStore] = useState<DemoPageStore | null>(null);

  useEffect(() => setStore(getPageStore()), []);

  const navigate = useCallback((id: string) => router.push(pageUrl(id)), [router]);

  const createRootPage = useCallback(async () => {
    if (!store) return;

    const page = await store.create({ parentId: null });
    navigate(page.id);
  }, [store, navigate]);

  // Clears the persisted workspace and reloads so the store re-seeds from scratch.
  function reset() {
    try {
      localStorage.removeItem(PAGES_STORAGE_KEY);
    } catch {
      // Storage denied: there is nothing persisted to clear.
    }

    window.location.assign(pageUrl(DEMO_ROOT_PAGE_ID));
  }

  return (
    <>
      <DemoHeader
        title="Notes"
        description="A Notion-style workspace: nested pages, sub-page blocks, @ page links, backlinks, icons and covers, all persisted in this browser."
        actions={
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcwIcon aria-hidden />
            Reset workspace
          </Button>
        }
      />
      {store ? (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <aside
            aria-label="Pages"
            className="border-border w-full shrink-0 border-b pb-4 md:sticky md:top-20 md:w-60 md:border-r md:border-b-0 md:pr-4 md:pb-0"
          >
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
            <PageView store={store} pageId={pageId} navigate={navigate} />
          </div>
        </div>
      ) : (
        <Skeleton />
      )}
    </>
  );
}
