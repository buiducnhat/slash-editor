import { defaultBlockTypes } from "@slash-editor/core";
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
import { useEffect, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { resolveIcon } from "@/lib/icons.ts";

const GUTTER_OFFSET = 72;

export function BlockHandle({ editor }: { editor: Editor }) {
  const drag = useBlockDrag(editor);
  const ai = useAiActions(editor, "block");
  const gripRef = useRef<HTMLButtonElement | null>(null);
  const gripOffsetRef = useRef<DOMRect | null>(null);
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
      <DropdownMenu
        open={!!target}
        modal={false}
        onOpenChange={(open, details) => {
          if (!open && details?.reason !== "sibling-open") drag.closeMenu();
        }}
      >
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
