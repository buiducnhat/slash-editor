import { pageTitle } from "@slash-editor/core";
import type { PageStore } from "@slash-editor/core";
import { useBacklinks } from "@slash-editor/react";
import { FileTextIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

export interface PageBacklinksProps {
  store: PageStore;
  pageId: string | null | undefined;
  onNavigate: (pageId: string) => void;
  className?: string;
}

/** Pages that link to `pageId`, from the host's `store.backlinks` index. */
export function PageBacklinks({
  store,
  pageId,
  onNavigate,
  className,
}: PageBacklinksProps): ReactNode {
  const { pages, loading } = useBacklinks(store, pageId);

  return (
    <section
      data-testid="page-backlinks"
      aria-label="Backlinks"
      className={cn("flex flex-col gap-1", className)}
    >
      <h2 className="text-sm font-medium">Backlinks</h2>
      {loading ? null : pages.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pages link here yet.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onNavigate(page.id)}
                className="hover:bg-muted/60 flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm"
              >
                {page.icon ? (
                  <span aria-hidden className="shrink-0 leading-none">
                    {page.icon}
                  </span>
                ) : (
                  <FileTextIcon aria-hidden className="text-muted-foreground size-4 shrink-0" />
                )}
                <span className="truncate">{pageTitle(page)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
