import { getPagesOptions, pageTitle } from "@slash-editor/core";
import type { PageMeta, PageStore } from "@slash-editor/core";
import { usePage } from "@slash-editor/react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { FileTextIcon } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "cn";

/** Fallback when the kit was built without `pages`: nodes render, never navigate. */
const NO_STORE: PageStore = {
  create: () => {
    throw new Error("No PageStore");
  },
  update: () => {},
  peek: () => undefined,
  load: () => Promise.resolve(undefined),
  listChildren: () => [],
  search: () => [],
  subscribe: () => () => {},
};

type NodeStatus = "ready" | "loading" | "missing" | "trashed";

function usePageNode({ editor, node }: NodeViewProps) {
  const options = getPagesOptions(editor);
  const pageId = node.attrs.pageId as string;
  const { page, status } = usePage(options?.store ?? NO_STORE, pageId);
  const nodeStatus: NodeStatus = page?.trashed ? "trashed" : status;

  return {
    page,
    status: nodeStatus,
    navigate: () => options?.onNavigate(pageId),
  };
}

/**
 * The page's emoji, or a document glyph, inside one fixed box. Emoji and svg
 * both centre in it, so a caller aligns the box once and both line up.
 */
function PageIcon({ page, className }: { page: PageMeta | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center leading-none", className)}
    >
      {page?.icon || <FileTextIcon className="text-muted-foreground size-full" />}
    </span>
  );
}

function activate(event: KeyboardEvent, navigate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    navigate();
  }
}

function Label({
  page,
  status,
  titleClassName,
}: {
  page: PageMeta | undefined;
  status: NodeStatus;
  titleClassName?: string;
}): ReactNode {
  if (status === "missing") {
    return <span className="text-muted-foreground">Page not found</span>;
  }

  if (status === "loading") {
    return <span aria-hidden className="bg-muted inline-block h-4 w-24 animate-pulse rounded" />;
  }

  return (
    <>
      <span
        className={cn("truncate", titleClassName, status === "trashed" && "text-muted-foreground")}
      >
        {pageTitle(page)}
      </span>
      {status === "trashed" ? (
        <span className="text-muted-foreground shrink-0 text-xs">(in trash)</span>
      ) : null}
    </>
  );
}

/** Block row for a child page; click or Enter navigates through `PagesOptions.onNavigate`. */
export function SubPageNodeView(props: NodeViewProps) {
  const { page, status, navigate } = usePageNode(props);

  return (
    <NodeViewWrapper
      role="link"
      tabIndex={0}
      contentEditable={false}
      data-status={status}
      data-testid="sub-page"
      className="hover:bg-muted/60 focus-visible:ring-ring flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-base font-medium outline-none select-none focus-visible:ring-2"
      onClick={navigate}
      onKeyDown={(event: KeyboardEvent) => activate(event, navigate)}
    >
      <PageIcon page={page} className="size-5 text-lg leading-none" />
      <Label page={page} status={status} />
    </NodeViewWrapper>
  );
}

/** Inline chip linking to a page; the title renders live from the store. */
export function PageLinkNodeView(props: NodeViewProps) {
  const { page, status, navigate } = usePageNode(props);

  return (
    <NodeViewWrapper
      as="span"
      role="link"
      tabIndex={0}
      contentEditable={false}
      data-status={status}
      data-testid="page-link"
      className="bg-muted/60 hover:bg-muted focus-visible:ring-ring cursor-pointer rounded px-1 outline-none focus-visible:ring-2"
      onClick={navigate}
      onKeyDown={(event: KeyboardEvent) => activate(event, navigate)}
    >
      <PageIcon
        page={page}
        className="mr-1 inline-flex size-[1em] -translate-y-[0.08em] align-middle"
      />
      <Label
        page={page}
        status={status}
        titleClassName="underline decoration-from-font underline-offset-2"
      />
    </NodeViewWrapper>
  );
}
