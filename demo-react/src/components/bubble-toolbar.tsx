import type { BubbleToolbarItem } from "@slash-editor/core";
import { useBubbleToolbar } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, TypeIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";

/** Icon keys are owned by the core registry; components are resolved here. */
const ICONS: Record<string, typeof TypeIcon> = {
  bold: BoldIcon,
  code: CodeIcon,
  italic: ItalicIcon,
  strikethrough: StrikethroughIcon,
};

function ToolbarButton({ editor, item }: { editor: Editor; item: BubbleToolbarItem }) {
  const Icon = item.icon ? ICONS[item.icon] : undefined;
  const active = item.isActive(editor);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={item.label}
      aria-pressed={active}
      className={cn(active && "bg-muted text-foreground")}
      // A mark toggle must never move focus out of the document: the
      // selection driving `isActive`/`run` lives in the editor, not here.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => item.run(editor)}
    >
      {Icon ? <Icon /> : item.label}
    </Button>
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
        className="w-auto flex-row gap-0.5 p-1"
      >
        {toolbar.items.map((item) => (
          <ToolbarButton key={item.id} editor={editor} item={item} />
        ))}
      </PopoverContent>
    </Popover>
  );
}
