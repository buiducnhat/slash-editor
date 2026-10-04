import { pageTitle } from "@slash-editor/core";
import type { PageStore } from "@slash-editor/core";
import { usePageTree } from "@slash-editor/react";
import { ChevronRightIcon, FileTextIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "cn";

/** Left padding per depth — static so Tailwind can see every class. */
const INDENT_CLASSES = ["pl-1", "pl-5", "pl-9", "pl-13", "pl-17", "pl-21", "pl-25", "pl-29"];

export interface PageTreeProps {
  store: PageStore;
  activePageId: string | null | undefined;
  /** Parent whose children are the top level. @default null */
  rootId?: string | null;
  /** Pages expanded on mount, e.g. the ancestors of the open page. */
  defaultExpanded?: readonly string[];
  onNavigate: (pageId: string) => void;
  /** Shows the `+` button in the header when given. */
  onCreate?: () => void;
  className?: string;
}

/** Lazily expanded page tree with an active-row highlight. */
export function PageTree({
  store,
  activePageId,
  rootId = null,
  defaultExpanded,
  onNavigate,
  onCreate,
  className,
}: PageTreeProps): ReactNode {
  const { rows, toggle, expand, collapse } = usePageTree(store, rootId, { defaultExpanded });

  return (
    <div data-testid="page-tree" className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-xs font-medium">Pages</p>
        {onCreate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="New page"
            onClick={onCreate}
          >
            <PlusIcon />
          </Button>
        ) : null}
      </div>
      <div role="tree" aria-label="Pages" className="flex flex-col gap-0.5">
        {rows.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1 text-sm">No pages yet.</p>
        ) : null}
        {rows.map(({ page, depth, expanded }, index) => {
          const active = page.id === activePageId;
          return (
            <div
              key={page.id}
              role="treeitem"
              tabIndex={0}
              aria-selected={active}
              aria-expanded={expanded}
              aria-current={active ? "page" : undefined}
              data-page-id={page.id}
              className={cn(
                "hover:bg-muted/60 focus-visible:ring-ring flex cursor-pointer items-center gap-1 rounded-sm py-1 pr-2 text-sm outline-none focus-visible:ring-2",
                INDENT_CLASSES[Math.min(depth, INDENT_CLASSES.length - 1)],
                active && "bg-muted text-foreground font-medium",
              )}
              onClick={() => onNavigate(page.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;

                const items =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
                    '[role="treeitem"]',
                  );
                const focusRow = (target: number) => items?.[target]?.focus();
                const parentIndex = () => {
                  for (let at = index - 1; at >= 0; at--) {
                    if ((rows[at]?.depth ?? 0) < depth) return at;
                  }
                  return -1;
                };

                switch (event.key) {
                  case "Enter":
                    onNavigate(page.id);
                    break;
                  case "ArrowDown":
                    focusRow(index + 1);
                    break;
                  case "ArrowUp":
                    focusRow(index - 1);
                    break;
                  case "ArrowRight":
                    // Collapsed: open it. Open: step into its first child.
                    if (!expanded) expand(page.id);
                    else if ((rows[index + 1]?.depth ?? 0) > depth) focusRow(index + 1);
                    break;
                  case "ArrowLeft":
                    // Open: close it. Otherwise: step out to the parent row.
                    if (expanded) collapse(page.id);
                    else focusRow(parentIndex());
                    break;
                  default:
                    return;
                }

                event.preventDefault();
              }}
            >
              <button
                type="button"
                aria-label={expanded ? "Collapse" : "Expand"}
                aria-expanded={expanded}
                tabIndex={-1}
                className="hover:bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm"
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(page.id);
                }}
              >
                <ChevronRightIcon
                  aria-hidden
                  className={cn("size-3.5 transition-transform", expanded && "rotate-90")}
                />
              </button>
              {page.icon ? (
                <span aria-hidden className="shrink-0 leading-none">
                  {page.icon}
                </span>
              ) : (
                <FileTextIcon aria-hidden className="text-muted-foreground size-4 shrink-0" />
              )}
              <span className="truncate">{pageTitle(page)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
