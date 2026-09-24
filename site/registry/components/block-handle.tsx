import { useBlockDrag } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import {
  ChevronRightIcon,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  CopyPlusIcon,
  GripVerticalIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  PlusIcon,
  QuoteIcon,
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
import { cn } from "@/lib/utils.ts";

let lastCopiedContent: { html: string; text: string } | null = null;
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
  const gripRef = useRef<HTMLButtonElement | null>(null);
  // The grip's box relative to the menu block's gutter row, measured when the
  // menu opens. The menu anchors to the live row plus this offset, so it
  // tracks the block through scrolls instead of a stale viewport snapshot.
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

  // The gutter is positioned from a rect read at render time. The extension
  // re-resolves hover on scroll, which re-renders a hovered gutter, but an open
  // menu pins the gutter to its block regardless of hover: re-measure here.
  const menuOpen = !!drag.menuTarget;
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    document.addEventListener("scroll", rerender, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", rerender, { capture: true });
  }, [menuOpen]);

  const activeAnchor = drag.menuTarget ? drag.menuAnchor : drag.hoverAnchor;
  const activeRect =
    drag.menuTarget || (drag.hovered && !drag.dragging)
      ? activeAnchor?.getBoundingClientRect()
      : null;
  const dropRect = drag.dragging ? drag.dropAnchor?.getBoundingClientRect() : null;
  return (
    <>
      {activeRect && (drag.menuTarget || drag.hovered) && (
        <div
          className="fixed z-40 flex items-center gap-0.5"
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

                    // Open slash command at the newly created line's caret
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
      )}
      {dropRect && (
        <div
          className={cn("bg-primary fixed z-40 h-0.5 rounded-full")}
          style={{ top: dropRect.top, left: dropRect.left, width: dropRect.width }}
        />
      )}
      <DropdownMenu
        open={!!drag.menuTarget}
        modal={false}
        onOpenChange={(open, eventDetails) => {
          if (!open) {
            if (eventDetails?.reason === "sibling-open") {
              return;
            }
            drag.closeMenu();
          }
        }}
      >
        <DropdownMenuContent
          anchor={{
            getBoundingClientRect: () => {
              const row = activeAnchor?.getBoundingClientRect();
              if (!row) {
                return new DOMRect(0, 0, 0, 0);
              }
              const offset = gripOffsetRef.current;
              if (offset) {
                return new DOMRect(
                  row.left + offset.x,
                  row.top + offset.y,
                  offset.width,
                  offset.height,
                );
              }
              // Offset to where the grip button sits in the gutter
              return new DOMRect(row.left - GUTTER_OFFSET + 28, row.top, 28, 28);
            },
          }}
          align="start"
          side="right"
          sideOffset={8}
          className="w-68 min-w-64 max-w-72 p-1"
        >
          {/* Ask AI */}
          <DropdownMenuItem
            onClick={() => {
              if (!drag.menuTarget) {
                return;
              }
              const target = drag.menuTarget;
              drag.closeMenu();
              editor
                .chain()
                .focus()
                .setTextSelection(target.pos + 1)
                .run();
              // If AI action command exists, run it
              const aiBlockRegistered = editor.schema.nodes.aiBlock !== undefined;
              if (aiBlockRegistered && typeof editor.commands.runAiAction === "function") {
                const context = editor.state.doc.textBetween(
                  target.pos,
                  target.pos + target.size,
                  "\n",
                );
                const runAiAction = editor.commands.runAiAction as unknown as (options: {
                  action: string;
                  prompt: string;
                  context: string;
                }) => boolean;
                runAiAction({
                  action: "continue-writing",
                  prompt: "Improve or continue writing for this block:",
                  context,
                });
              } else {
                editor.storage.slashCommand?.openAtCaret();
              }
            }}
          >
            <SparklesIcon />
            <span>Ask AI</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Turn into submenu */}
          <DropdownMenuSub
            onOpenChange={(open, eventDetails) => {
              if (!open && eventDetails?.reason === "focus-out") {
                eventDetails.cancel();
              }
            }}
          >
            <DropdownMenuSubTrigger>
              <TypeIcon />
              <span>Turn into</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 p-1">
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setParagraph()
                    .run();
                }}
              >
                <TypeIcon />
                <span>Text</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setNode("heading", { level: 1 })
                    .run();
                }}
              >
                <Heading1Icon />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setNode("heading", { level: 2 })
                    .run();
                }}
              >
                <Heading2Icon />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setNode("heading", { level: 3 })
                    .run();
                }}
              >
                <Heading3Icon />
                <span>Heading 3</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .toggleBulletList()
                    .run();
                }}
              >
                <ListIcon />
                <span>Bulleted list</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .toggleOrderedList()
                    .run();
                }}
              >
                <ListOrderedIcon />
                <span>Numbered list</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .toggleTaskList()
                    .run();
                }}
              >
                <ListChecksIcon />
                <span>To-do list</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setToggle()
                    .run();
                }}
              >
                <ChevronRightIcon />
                <span>Toggle list</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setCodeBlock()
                    .run();
                }}
              >
                <CodeIcon />
                <span>Code</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .toggleBlockquote()
                    .run();
                }}
              >
                <QuoteIcon />
                <span>Quote</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const target = drag.menuTarget;
                  drag.closeMenu();
                  if (!target) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(target.pos + 1)
                    .setCallout()
                    .run();
                }}
              >
                <MessageSquareIcon />
                <span>Callout</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Copy */}
          <DropdownMenuItem
            onClick={() => {
              if (!drag.menuTarget) {
                return;
              }
              const node = editor.state.doc.nodeAt(drag.menuTarget.pos);
              if (!node) {
                return;
              }
              const dom = DOMSerializer.fromSchema(editor.schema).serializeNode(node);
              const container = document.createElement("div");
              container.appendChild(dom);
              const html = container.innerHTML;
              const text = node.textContent;

              lastCopiedContent = { html, text };

              if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
                const blobHtml = new Blob([html], { type: "text/html" });
                const blobText = new Blob([text], { type: "text/plain" });
                void navigator.clipboard
                  .write([
                    new ClipboardItem({
                      "text/html": blobHtml,
                      "text/plain": blobText,
                    }),
                  ])
                  .catch(() => {
                    void navigator.clipboard?.writeText(text);
                  });
              } else {
                void navigator.clipboard?.writeText(text);
              }

              editor.chain().focus().run();
              drag.closeMenu();
            }}
          >
            <CopyIcon />
            <span>Copy</span>
          </DropdownMenuItem>

          {/* Paste below */}
          <DropdownMenuItem
            onClick={async () => {
              if (!drag.menuTarget) {
                return;
              }
              const insertPos = drag.menuTarget.pos + drag.menuTarget.size;
              let inserted = false;

              try {
                if (navigator.clipboard?.read) {
                  const items = await navigator.clipboard.read();
                  for (const item of items) {
                    if (item.types.includes("text/html")) {
                      const blob = await item.getType("text/html");
                      const html = await blob.text();
                      editor.chain().focus().insertContentAt(insertPos, html).run();
                      inserted = true;
                      break;
                    }
                  }
                }
                if (!inserted && navigator.clipboard?.readText) {
                  const text = await navigator.clipboard.readText();
                  if (text) {
                    editor.chain().focus().insertContentAt(insertPos, text).run();
                    inserted = true;
                  }
                }
              } catch {
                // Clipboard read permission might be denied
              }

              if (!inserted && lastCopiedContent) {
                editor
                  .chain()
                  .focus()
                  .insertContentAt(insertPos, lastCopiedContent.html || lastCopiedContent.text)
                  .run();
                inserted = true;
              }

              if (!inserted) {
                editor
                  .chain()
                  .focus()
                  .insertContentAt(insertPos, { type: "paragraph" })
                  .setTextSelection(insertPos + 1)
                  .run();
              }

              drag.closeMenu();
            }}
          >
            <ClipboardPasteIcon />
            <span>Paste below</span>
          </DropdownMenuItem>

          {/* Duplicate */}
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
            <CopyPlusIcon />
            <span>Duplicate</span>
          </DropdownMenuItem>
          {/* Delete */}
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
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
