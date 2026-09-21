import { useActiveItemScroll, useSlashMenu } from "@slash-editor/react";
import type { SlashItem } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import {
  BrainIcon,
  BroomSparklesIcon,
  ChevronRightIcon,
  CodeIcon,
  ColumnsIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  MinusIcon,
  PaperclipIcon,
  PencilSparklesIcon,
  QuoteIcon,
  SparklesIcon,
  SpellCheckIcon,
  SquareDashedIcon,
  TableIcon,
  TypeIcon,
  VideoIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";

/** Icon keys are owned by the core registry; components are resolved here. */
const ICONS: Record<string, typeof TypeIcon> = {
  brain: BrainIcon,
  "broom-sparkles": BroomSparklesIcon,
  "chevron-right": ChevronRightIcon,
  code: CodeIcon,
  columns: ColumnsIcon,
  "heading-1": Heading1Icon,
  "heading-2": Heading2Icon,
  "heading-3": Heading3Icon,
  image: ImageIcon,
  link: LinkIcon,
  list: ListIcon,
  "list-checks": ListChecksIcon,
  "list-ordered": ListOrderedIcon,
  "message-square": MessageSquareIcon,
  minus: MinusIcon,
  paperclip: PaperclipIcon,
  "pencil-sparkles": PencilSparklesIcon,
  quote: QuoteIcon,
  sparkles: SparklesIcon,
  "spell-check": SpellCheckIcon,
  table: TableIcon,
  text: TypeIcon,
  video: VideoIcon,
};

/** An unmapped key still renders a row with an icon, never a blank slot. */
const FALLBACK_ICON = SquareDashedIcon;

export function SlashMenu({ editor }: { editor: Editor }) {
  const menu = useSlashMenu(editor);
  const listRef = useActiveItemScroll(menu.activeItem?.id);

  const groups = useMemo(() => {
    const byGroup = new Map<string, SlashItem[]>();

    for (const item of menu.items) {
      const existing = byGroup.get(item.group);

      if (existing) {
        existing.push(item);
      } else {
        byGroup.set(item.group, [item]);
      }
    }

    return [...byGroup];
  }, [menu.items]);

  return (
    <Popover
      open={menu.open}
      onOpenChange={(open) => {
        if (!open) {
          menu.close();
        }
      }}
    >
      <PopoverContent
        anchor={menu.anchor ?? undefined}
        align="start"
        side="bottom"
        sideOffset={6}
        // The editor keeps focus: the suggestion plugin drives navigation.
        initialFocus={false}
        finalFocus={false}
        className="w-72 p-0"
      >
        <Command
          shouldFilter={false}
          value={menu.activeItem?.id ?? ""}
          onValueChange={(value) => {
            menu.setActiveIndex(menu.items.findIndex((item) => item.id === value));
          }}
        >
          <CommandList ref={listRef}>
            <CommandEmpty>No blocks match “{menu.query}”.</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => {
                  const Icon = (item.icon ? ICONS[item.icon] : undefined) ?? FALLBACK_ICON;

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      // The row is one line; the description survives as a tooltip.
                      title={item.description}
                      onSelect={() => menu.select(menu.items.indexOf(item))}
                    >
                      <Icon />
                      <span className="truncate">{item.title}</span>
                      {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
