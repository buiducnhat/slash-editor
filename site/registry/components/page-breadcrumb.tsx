import { pageTitle } from "@slash-editor/core";
import type { PageStore } from "@slash-editor/core";
import { useBreadcrumb } from "@slash-editor/react";
import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { cn } from "cn";

export interface PageBreadcrumbProps {
  store: PageStore;
  pageId: string | null | undefined;
  onNavigate: (pageId: string) => void;
  className?: string;
}

/** Ancestor trail ending at the current page; ancestors navigate, the last item is plain text. */
export function PageBreadcrumb({
  store,
  pageId,
  onNavigate,
  className,
}: PageBreadcrumbProps): ReactNode {
  const trail = useBreadcrumb(store, pageId);

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="page-breadcrumb"
      className={cn("text-muted-foreground flex min-w-0 items-center gap-1 text-sm", className)}
    >
      {trail.map((page, index) => {
        const last = index === trail.length - 1;
        return (
          <Fragment key={page.id}>
            {index > 0 ? <ChevronRightIcon aria-hidden className="size-3.5 shrink-0" /> : null}
            {last ? (
              <span aria-current="page" className="text-foreground truncate">
                {pageTitle(page)}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(page.id)}
                className="hover:text-foreground truncate rounded-sm"
              >
                {pageTitle(page)}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
