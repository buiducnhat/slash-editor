import type { BubbleToolbarItem } from "@slash-editor/core";
import { useBubbleToolbar } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import {
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LightbulbIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquarePlusIcon,
  PilcrowIcon,
  QuoteIcon,
  RemoveFormattingIcon,
  SparklesIcon,
  StrikethroughIcon,
  TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";

/** Icon keys are owned by the core registry; components are resolved here. */
const ICONS: Record<string, typeof TypeIcon> = {
  bold: BoldIcon,
  code: CodeIcon,
  italic: ItalicIcon,
  strikethrough: StrikethroughIcon,
  link: LinkIcon,
};

const SHORTCUTS: Record<string, string> = {
  bold: "⌘B",
  italic: "⌘I",
  strikethrough: "⌘⇧S",
  code: "⌘E",
  link: "⌘K",
};

function BlockTypeDropdown({ editor }: { editor: Editor }) {
  let label = "Text";
  let Icon = PilcrowIcon;

  if (editor.isActive("heading", { level: 1 })) {
    label = "Heading 1";
    Icon = Heading1Icon;
  } else if (editor.isActive("heading", { level: 2 })) {
    label = "Heading 2";
    Icon = Heading2Icon;
  } else if (editor.isActive("heading", { level: 3 })) {
    label = "Heading 3";
    Icon = Heading3Icon;
  } else if (editor.isActive("bulletList")) {
    label = "Bullet list";
    Icon = ListIcon;
  } else if (editor.isActive("orderedList")) {
    label = "Numbered list";
    Icon = ListOrderedIcon;
  } else if (editor.isActive("taskList")) {
    label = "To-do list";
    Icon = ListChecksIcon;
  } else if (editor.isActive("blockquote")) {
    label = "Quote";
    Icon = QuoteIcon;
  } else if (editor.isActive("callout")) {
    label = "Callout";
    Icon = LightbulbIcon;
  } else if (editor.isActive("codeBlock")) {
    label = "Code";
    Icon = CodeIcon;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onMouseDown={(event) => event.preventDefault()}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
            <ChevronDownIcon className="size-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="w-44">
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <PilcrowIcon className="size-4" />
          <span>Text</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1Icon className="size-4" />
          <span>Heading 1</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="size-4" />
          <span>Heading 2</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon className="size-4" />
          <span>Heading 3</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-4" />
          <span>Bullet list</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-4" />
          <span>Numbered list</span>
        </DropdownMenuItem>
        {editor.schema.nodes.taskList && (
          <DropdownMenuItem
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleTaskList?.().run()}
          >
            <ListChecksIcon className="size-4" />
            <span>To-do list</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="size-4" />
          <span>Quote</span>
        </DropdownMenuItem>
        {editor.schema.nodes.callout && (
          <DropdownMenuItem
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              editor.commands.toggleCallout ? editor.commands.toggleCallout() : undefined
            }
          >
            <LightbulbIcon className="size-4" />
            <span>Callout</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AskAiDropdown({ editor }: { editor: Editor }) {
  const handleAiAction = (actionPrompt: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText) return;

    if (editor.commands.runAiAction) {
      editor.commands.runAiAction({
        action: "ask-ai",
        prompt: actionPrompt,
        context: selectedText,
        adapter: {
          async *stream() {
            yield ` [${actionPrompt}: "${selectedText}"]`;
          },
        },
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50"
            onMouseDown={(event) => event.preventDefault()}
          >
            <SparklesIcon className="size-3.5 text-purple-500" />
            <span>Ask AI</span>
            <ChevronDownIcon className="size-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-48">
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleAiAction("Improve writing")}
        >
          <SparklesIcon className="size-4 text-purple-500" />
          <span>Improve writing</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleAiAction("Fix spelling & grammar")}
        >
          <CheckIcon className="size-4" />
          <span>Fix spelling & grammar</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleAiAction("Make shorter")}
        >
          <span>Make shorter</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleAiAction("Make longer")}
        >
          <span>Make longer</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleAiAction("Summarize")}
        >
          <span>Summarize</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolbarButton({ editor, item }: { editor: Editor; item: BubbleToolbarItem }) {
  const Icon = item.icon ? ICONS[item.icon] : undefined;
  const active = item.isActive(editor);
  const shortcut = SHORTCUTS[item.id];

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
            {Icon ? <Icon /> : item.label}
          </Button>
        }
      />
      <TooltipContent className="flex items-center gap-1.5 py-1 text-xs">
        <span>{item.label}</span>
        {shortcut && <kbd className="text-[10px] text-muted-foreground">{shortcut}</kbd>}
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
        // The editor keeps focus: buttons act on the live selection.
        initialFocus={false}
        finalFocus={false}
        className="w-auto flex-row items-center gap-0.5 p-1"
      >
        <BlockTypeDropdown editor={editor} />
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        {toolbar.items
          .filter((item) => item.id !== "link")
          .map((item) => (
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
          <TooltipContent className="py-1 text-xs">Clear formatting</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        {toolbar.items
          .filter((item) => item.id === "link")
          .map((item) => (
            <ToolbarButton key={item.id} editor={editor} item={item} />
          ))}
        {editor.schema.marks.comment && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Comment"
                  aria-pressed={editor.isActive("comment")}
                  className={cn(editor.isActive("comment") && "bg-muted text-foreground")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const threadId = crypto.randomUUID();
                    editor.commands.toggleComment?.(threadId);
                  }}
                >
                  <MessageSquarePlusIcon />
                </Button>
              }
            />
            <TooltipContent className="py-1 text-xs">Add comment</TooltipContent>
          </Tooltip>
        )}
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        <AskAiDropdown editor={editor} />
      </PopoverContent>
    </Popover>
  );
}
