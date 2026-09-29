import { useTableOfContents } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils.ts";

/**
 * Left padding per depth below the shallowest heading — a static record because
 * Tailwind cannot see a computed class name. 16px a level, and it owns the left
 * padding outright: a base `px-*` on the row would quietly cancel the step (a
 * `pl-3` over a `px-2` renders as a 4px difference, not 12px).
 */
const INDENT_CLASSES: Record<number, string> = {
  0: "pl-2",
  1: "pl-6",
  2: "pl-10",
  3: "pl-14",
  4: "pl-18",
  5: "pl-22",
};

const MAX_DEPTH = Object.keys(INDENT_CLASSES).length - 1;

export interface TableOfContentsProps {
  editor: Editor | null;
  /** Scrolling ancestor the active heading is tracked against. Defaults to the window. */
  scrollContainer?: RefObject<HTMLElement | null> | null;
  /** Label above the rows; `null` hides it. @default "On this page" */
  title?: string | null;
  className?: string;
}

/** Heading outline of the live document; the active row tracks the caret or scroll position. */
export function TableOfContents({
  editor,
  scrollContainer,
  title = "On this page",
  className,
}: TableOfContentsProps): ReactNode {
  const { items, active, select } = useTableOfContents(editor, { scrollContainer });

  if (items.length === 0) {
    return null;
  }

  let baseLevel = 6;
  for (const item of items) {
    if (item.level < baseLevel) baseLevel = item.level;
  }

  return (
    <nav
      aria-label="Table of contents"
      data-testid="table-of-contents"
      className={cn("flex flex-col gap-0.5", className)}
    >
      {title !== null ? <p className="text-sm font-medium">{title}</p> : null}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = active?.pos === item.pos;
          const depth = Math.min(item.level - baseLevel, MAX_DEPTH);
          return (
            <li key={item.id ?? String(item.pos)}>
              <button
                type="button"
                onClick={() => select(item)}
                data-testid="toc-item"
                data-toc-id={item.id ?? undefined}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex w-full items-center rounded-sm py-1 pr-2 text-left text-sm",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                  INDENT_CLASSES[depth],
                )}
              >
                <span className="truncate">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
