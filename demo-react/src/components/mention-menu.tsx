import { useMention } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { Loader2Icon, UserIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";

export function MentionMenu({ editor }: { editor: Editor }) {
  const mention = useMention(editor);

  return (
    <Popover
      open={mention.open}
      onOpenChange={(open) => {
        if (!open) {
          mention.close();
        }
      }}
    >
      <PopoverContent
        anchor={mention.anchor ?? undefined}
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
          value={mention.activeItem?.id ?? ""}
          onValueChange={(value) => {
            mention.setActiveIndex(mention.items.findIndex((item) => item.id === value));
          }}
        >
          <CommandList>
            {mention.loading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Searching…
              </div>
            ) : (
              <>
                <CommandEmpty>No matches for “{mention.query}”.</CommandEmpty>
                <CommandGroup>
                  {mention.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => mention.select(mention.items.indexOf(item))}
                    >
                      <UserIcon />
                      <span className="flex-1">{item.label}</span>
                      {item.description ? (
                        <span className="text-muted-foreground text-xs">{item.description}</span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
