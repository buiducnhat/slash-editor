import { defaultBlockTypes, type BlockTarget } from "@slash-editor/core";
import { useAiActions, useBlockDrag } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import {
  ClipboardPasteIcon,
  CopyIcon,
  CopyPlusIcon,
  GripVerticalIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { resolveIcon } from "@/lib/icons.ts";

const GUTTER_OFFSET = 72;

export function BlockHandle({ editor }: { editor: Editor }) {
  const drag = useBlockDrag(editor);
  const ai = useAiActions(editor, "block");
  const gripRef = useRef<HTMLButtonElement>(null);
  const gripOffsetRef = useRef<DOMRect | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  if (drag.menuTarget && drag.menuAnchor && gripRef.current && !gripOffsetRef.current) {
    const grip = gripRef.current.getBoundingClientRect();
    const row = drag.menuAnchor.getBoundingClientRect();
    gripOffsetRef.current = new DOMRect(
      grip.left - row.left,
      grip.top - row.top,
      grip.width,
      grip.height,
    );
  } else if (!drag.menuTarget && gripOffsetRef.current) {
    gripOffsetRef.current = null;
  }

  useEffect(() => {
    if (!drag.menuTarget) return;
    document.addEventListener("scroll", rerender, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", rerender, { capture: true });
  }, [drag.menuTarget]);

  const activeAnchor = drag.menuTarget ? drag.menuAnchor : drag.hoverAnchor;
  const activeRect =
    drag.menuTarget || (drag.hovered && !drag.dragging)
      ? activeAnchor?.getBoundingClientRect()
      : null;
  const dropRect = drag.dragging ? drag.dropAnchor?.getBoundingClientRect() : null;
  const target = drag.menuTarget;

  return (
    <>
      {activeRect && (drag.menuTarget || drag.hovered) ? (
        <div
          className="fixed flex items-center gap-0.5"
          style={{
            top: activeRect.top,
            left: activeRect.left - GUTTER_OFFSET,
            height: activeRect.height,
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Insert block below"
                  onClick={() => {
                    if (!drag.hovered) return;
                    const pos = drag.hovered.pos + drag.hovered.size;
                    editor
                      .chain()
                      .focus()
                      .insertContentAt(pos, { type: "paragraph" })
                      .setTextSelection(pos + 1)
                      .run();
                    editor.storage.slashCommand?.openAtCaret();
                  }}
                >
                  <PlusIcon />
                </Button>
              }
            />
            <TooltipContent>Insert block below</TooltipContent>
          </Tooltip>
          <Tooltip disabled={!!drag.menuTarget}>
            <TooltipTrigger
              render={
                <Button
                  ref={gripRef}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Drag to reorder, click to open the block menu"
                  className="cursor-grab active:cursor-grabbing"
                  {...drag.handleProps}
                  onPointerDown={(event) => {
                    pointerRef.current = { x: event.clientX, y: event.clientY };
                    drag.handleProps.onPointerDown(event);
                  }}
                >
                  <GripVerticalIcon />
                </Button>
              }
            />
            <TooltipContent>Drag to move, click to open menu</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
      {dropRect ? (
        <div
          className="bg-primary fixed h-0.5 rounded-full"
          style={{ top: dropRect.top, left: dropRect.left, width: dropRect.width }}
        />
      ) : null}
      {drag.dragging ? (
        <BlockDragPreview target={drag.dragging} initialPointer={pointerRef.current} />
      ) : null}
      <DropdownMenu
        open={!!target}
        modal={false}
        onOpenChange={(open, details) => {
          if (!open && details?.reason !== "sibling-open") drag.closeMenu();
        }}
      >
        <DropdownMenuTrigger
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
        <DropdownMenuContent
          anchor={{
            getBoundingClientRect: () => {
              const row = activeAnchor?.getBoundingClientRect();
              if (!row) return new DOMRect(0, 0, 0, 0);
              const offset = gripOffsetRef.current;
              return offset
                ? new DOMRect(row.left + offset.x, row.top + offset.y, offset.width, offset.height)
                : new DOMRect(row.left - GUTTER_OFFSET + 28, row.top, 28, 28);
            },
          }}
          align="start"
          side="right"
          sideOffset={8}
          className="w-68 min-w-64 max-w-72 p-1"
        >
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SparklesIcon />
              <span>Ask AI</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52 p-1">
              {ai.actions.map((action) => {
                const Icon = resolveIcon(action.icon);
                return (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => {
                      if (!target) return;
                      const pos = target.pos;
                      drag.closeMenu();
                      ai.run(action, { pos });
                    }}
                  >
                    <Icon />
                    <span>{action.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TypeIcon />
              <span>Turn into</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 p-1">
              {defaultBlockTypes
                .filter((type) => type.when?.(editor) ?? true)
                .map((type) => {
                  const Icon = resolveIcon(type.icon);
                  return (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => {
                        if (!target) return;
                        const pos = target.pos;
                        drag.closeMenu();
                        type.convert({ editor, pos });
                      }}
                    >
                      <Icon />
                      <span>{type.title}</span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (!target) return;
              editor.commands.copyBlock({ pos: target.pos, size: target.size });
              drag.closeMenu();
            }}
          >
            <CopyIcon />
            <span>Copy</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!target) return;
              editor.commands.pasteBlockBelow({ pos: target.pos, size: target.size });
              drag.closeMenu();
            }}
          >
            <ClipboardPasteIcon />
            <span>Paste below</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!target) return;
              editor.commands.duplicateBlock({ pos: target.pos, size: target.size });
              drag.closeMenu();
            }}
          >
            <CopyPlusIcon />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (!target) return;
              editor.commands.deleteBlock({ pos: target.pos, size: target.size });
              drag.closeMenu();
            }}
          >
            <Trash2Icon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function BlockDragPreview({
  target,
  initialPointer,
}: {
  target: BlockTarget;
  initialPointer?: { x: number; y: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const fallbackPointer =
    initialPointer ??
    (() => {
      const rect = target.getClientRect();
      return rect ? { x: rect.left, y: rect.top } : null;
    })();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentX = fallbackPointer?.x ?? 0;
    let currentY = fallbackPointer?.y ?? 0;
    let rafId = 0;

    const updateTransform = () => {
      rafId = 0;
      if (container) {
        container.style.transform = `translate3d(${currentX + 12}px, ${currentY + 12}px, 0)`;
      }
    };

    if (fallbackPointer) {
      updateTransform();
    }

    const onPointerMove = (e: PointerEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [fallbackPointer]);

  useEffect(() => {
    const content = contentRef.current;
    const source = target.getDOMNode();
    if (!content || !source) return;

    const clone = source.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-dragging");
    clone.removeAttribute("contenteditable");
    clone.setAttribute("inert", "");
    clone.setAttribute("aria-hidden", "true");

    const editables = clone.querySelectorAll("[contenteditable]");
    for (const el of editables) {
      el.removeAttribute("contenteditable");
    }

    const originalCheckboxes = source.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const clonedCheckboxes = clone.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    originalCheckboxes.forEach((orig, idx) => {
      if (clonedCheckboxes[idx]) {
        clonedCheckboxes[idx].checked = orig.checked;
        clonedCheckboxes[idx].defaultChecked = orig.checked;
      }
    });

    content.innerHTML = "";

    if (clone.tagName === "LI") {
      const isTask =
        clone.getAttribute("data-type") === "taskItem" ||
        clone.getAttribute("data-block-type") === "taskItem";
      if (!isTask) {
        const listWrapper = document.createElement("ul");
        listWrapper.className = "list-disc pl-5 my-0";
        listWrapper.appendChild(clone);
        content.appendChild(listWrapper);
      } else {
        content.appendChild(clone);
      }
    } else {
      content.appendChild(clone);
    }

    if (content.scrollHeight > 192) {
      setIsTruncated(true);
    }
  }, [target]);

  const initialStyle = fallbackPointer
    ? { transform: `translate3d(${fallbackPointer.x + 12}px, ${fallbackPointer.y + 12}px, 0)` }
    : { transform: "translate3d(-9999px, -9999px, 0)" };

  return (
    <div
      ref={containerRef}
      data-block-drag-preview
      className="pointer-events-none fixed top-0 left-0 z-50 transition-transform duration-75 ease-out select-none will-change-transform"
      style={initialStyle}
    >
      <div className="relative max-h-48 max-w-[min(540px,80vw)] min-w-[120px] overflow-hidden rounded-lg border border-border/80 bg-background/90 p-3 shadow-2xl backdrop-blur-sm rotate-[1.5deg] scale-[1.02] opacity-85">
        <div ref={contentRef} className="slash-content text-sm" />
        {isTruncated ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
        ) : null}
      </div>
    </div>
  );
}
