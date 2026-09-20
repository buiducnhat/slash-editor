import { useSlashMenu } from "@slash-editor/react";
import type { SlashItem } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import {
  ChevronRightIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  MinusIcon,
  QuoteIcon,
  TypeIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";

/** Icon keys are owned by the core registry; components are resolved here. */
const ICONS: Record<string, typeof TypeIcon> = {
  "chevron-right": ChevronRightIcon,
  code: CodeIcon,
  "heading-1": Heading1Icon,
  "heading-2": Heading2Icon,
  "heading-3": Heading3Icon,
  list: ListIcon,
  "list-checks": ListChecksIcon,
  "list-ordered": ListOrderedIcon,
  "message-square": MessageSquareIcon,
  minus: MinusIcon,
  quote: QuoteIcon,
  text: TypeIcon,
};

export function SlashMenu({ editor }: { editor: Editor }) {
  const menu = useSlashMenu(editor);

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
          <CommandList>
            <CommandEmpty>No blocks match “{menu.query}”.</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => {
                  const Icon = item.icon ? ICONS[item.icon] : undefined;

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => menu.select(menu.items.indexOf(item))}
                    >
                      {Icon ? <Icon /> : null}
                      <span className="flex-1">{item.title}</span>
                      {item.description ? (
                        <span className="text-muted-foreground text-xs">{item.description}</span>
                      ) : null}
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
