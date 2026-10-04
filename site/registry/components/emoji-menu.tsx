import { useActiveItemScroll, useEmoji } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";

export function EmojiMenu({ editor }: { editor: Editor }) {
  const emoji = useEmoji(editor);
  const listRef = useActiveItemScroll(emoji.activeItem?.name);

  return (
    <Popover
      open={emoji.open}
      onOpenChange={(open) => {
        if (!open) {
          emoji.close();
        }
      }}
    >
      <PopoverContent
        anchor={emoji.anchor ?? undefined}
        align="start"
        side="bottom"
        sideOffset={6}
        // The editor keeps focus: the suggestion plugin drives navigation.
        initialFocus={false}
        finalFocus={false}
        className="w-64 p-0"
      >
        <Command
          shouldFilter={false}
          value={emoji.activeItem?.name ?? ""}
          onValueChange={(value) => {
            emoji.setActiveIndex(emoji.items.findIndex((item) => item.name === value));
          }}
        >
          <CommandList ref={listRef}>
            <CommandEmpty>No emoji for “{emoji.query}”.</CommandEmpty>
            <CommandGroup>
              {emoji.items.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.name}
                  onSelect={() => emoji.select(emoji.items.indexOf(item))}
                >
                  <span className="flex size-5 items-center justify-center text-base">
                    {item.emoji ?? <img src={item.fallbackImage} alt="" className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name.replaceAll("_", " ")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
