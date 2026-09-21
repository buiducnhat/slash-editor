import { useLinkEditor } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { ExternalLinkIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export function LinkEditorPopover({ editor }: { editor: Editor }) {
  const link = useLinkEditor(editor);

  return (
    <Popover
      open={link.open}
      onOpenChange={(open) => {
        if (!open) {
          link.close();
        }
      }}
    >
      <PopoverContent
        anchor={link.anchor ?? undefined}
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-80 flex-row items-center gap-1 p-1"
      >
        <Input
          autoFocus
          value={link.href}
          placeholder="Paste a link…"
          className="h-7 flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
          onChange={(event) => link.setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              link.confirm();
            }
          }}
        />
        {link.editing && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Open link"
              disabled={!link.href}
              onClick={() => window.open(link.href, "_blank", "noopener,noreferrer")}
            >
              <ExternalLinkIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove link"
              onClick={link.remove}
            >
              <TrashIcon />
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!link.href.trim()}
          onClick={link.confirm}
        >
          {link.editing ? "Update" : "Set link"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
