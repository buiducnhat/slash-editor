import { useBlockDrag } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { CopyIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";

// Button group is 2 × 28px (icon-sm) + 2px gap = 58px wide; offset leaves a
// 14px gap to the text and 8px of clearance from the card's own edge, given
// `.slash-content`'s pl-20 (80px) left padding in app.tsx.
const GUTTER_OFFSET = 72;

/**
 * Gutter overlay: a hover handle (insert below / drag to reorder, or click
 * for the block menu) plus the drop indicator while dragging. Rendered
 * outside the editor DOM and positioned from `useBlockDrag`'s anchors, so
 * the core never emits markup.
 */
export function BlockHandle({ editor }: { editor: Editor }) {
  const drag = useBlockDrag(editor);
  const hoverRect =
    drag.hovered && !drag.dragging ? drag.hoverAnchor?.getBoundingClientRect() : null;
  const dropRect = drag.dragging ? drag.dropAnchor?.getBoundingClientRect() : null;
  const menuRect = drag.menuTarget ? drag.menuAnchor?.getBoundingClientRect() : null;

  return (
    <>
      {hoverRect && drag.hovered && (
        <div
          className="fixed z-40 flex items-center gap-0.5"
          style={{
            top: hoverRect.top,
            left: hoverRect.left - GUTTER_OFFSET,
            height: hoverRect.height,
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
                    if (!drag.hovered) {
                      return;
                    }
                    const pos = drag.hovered.pos + drag.hovered.size;
                    editor
                      .chain()
                      .focus()
                      .insertContentAt(pos, { type: "paragraph" })
                      .setTextSelection(pos + 1)
                      .run();
                  }}
                >
                  <PlusIcon />
                </Button>
              }
            />
            <TooltipContent>Insert block below</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
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
      )}
      {dropRect && (
        <div
          className={cn("bg-primary fixed z-40 h-0.5 rounded-full")}
          style={{ top: dropRect.top, left: dropRect.left, width: dropRect.width }}
        />
      )}
      <DropdownMenu
        open={!!drag.menuTarget}
        onOpenChange={(open) => {
          if (!open) {
            drag.closeMenu();
          }
        }}
      >
        <DropdownMenuContent anchor={menuRect ? { getBoundingClientRect: () => menuRect } : null}>
          <DropdownMenuItem
            onClick={() => {
              if (!drag.menuTarget) {
                return;
              }
              editor.commands.duplicateBlock({
                pos: drag.menuTarget.pos,
                size: drag.menuTarget.size,
              });
              drag.closeMenu();
            }}
          >
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (!drag.menuTarget) {
                return;
              }
              editor.commands.deleteBlock({
                pos: drag.menuTarget.pos,
                size: drag.menuTarget.size,
              });
              drag.closeMenu();
            }}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
