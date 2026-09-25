import { defaultBlockTypes, type BubbleToolbarItem } from "@slash-editor/core";
import { useBubbleToolbar } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import {
  ChevronDownIcon,
  MessageSquarePlusIcon,
  RemoveFormattingIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { resolveIcon } from "@/lib/icons.ts";
import { cn } from "@/lib/utils.ts";

function BlockTypeDropdown({ editor }: { editor: Editor }) {
  const active = defaultBlockTypes.find((type) => type.isActive(editor));
  const ActiveIcon = resolveIcon(active?.icon);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 text-xs"
            onMouseDown={(event) => event.preventDefault()}
          >
            <ActiveIcon data-icon="inline-start" />
            <span>{active?.title ?? "Text"}</span>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-48">
        {defaultBlockTypes
          .filter((type) => type.when?.(editor) ?? true)
          .map((type) => {
            const Icon = resolveIcon(type.icon);
            return (
              <DropdownMenuItem
                key={type.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => type.convert({ editor })}
              >
                <Icon />
                <span>{type.title}</span>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AskAiDropdown({ editor }: { editor: Editor }) {
  const actions =
    editor.storage.ai?.actions.filter((action) => action.contexts.includes("selection")) ?? [];

  if (actions.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 text-xs"
            onMouseDown={(event) => event.preventDefault()}
          >
            <SparklesIcon data-icon="inline-start" />
            <span>Ask AI</span>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {actions.map((action) => {
          const Icon = resolveIcon(action.icon);
          return (
            <DropdownMenuItem
              key={action.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                editor.commands.runAiAction({
                  action: action.id,
                  prompt: action.prompt,
                  scope: "selection",
                })
              }
            >
              <Icon />
              <span>{action.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolbarButton({ editor, item }: { editor: Editor; item: BubbleToolbarItem }) {
  const Icon = resolveIcon(item.icon);
  const active = item.isActive(editor);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={item.label}
            aria-pressed={active}
            className={cn(active && "bg-muted text-foreground")}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => item.run(editor)}
          >
            <Icon />
          </Button>
        }
      />
      <TooltipContent className="flex items-center gap-1.5 py-1 text-xs">
        <span>{item.label}</span>
        {item.shortcut ? (
          <kbd className="text-muted-foreground text-[10px]">{item.shortcut}</kbd>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function BubbleToolbar({ editor }: { editor: Editor }) {
  const toolbar = useBubbleToolbar(editor);

  return (
    <Popover open={toolbar.open}>
      <PopoverContent
        anchor={toolbar.anchor ?? undefined}
        align="center"
        side="top"
        sideOffset={8}
        initialFocus={false}
        finalFocus={false}
        className="w-auto flex-row items-center gap-0.5 p-1"
      >
        <BlockTypeDropdown editor={editor} />
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        {toolbar.items.map((item) => (
          <ToolbarButton key={item.id} editor={editor} item={item} />
        ))}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear formatting"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().unsetAllMarks().run()}
              >
                <RemoveFormattingIcon />
              </Button>
            }
          />
          <TooltipContent>Clear formatting</TooltipContent>
        </Tooltip>
        {editor.storage.comment?.store ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Comment"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.commands.openCommentComposer()}
                >
                  <MessageSquarePlusIcon />
                </Button>
              }
            />
            <TooltipContent>Add comment</TooltipContent>
          </Tooltip>
        ) : null}
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        <AskAiDropdown editor={editor} />
      </PopoverContent>
    </Popover>
  );
}
