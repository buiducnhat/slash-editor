import { useComments } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent } from "@/components/ui/popover.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

export function CommentComposer({ editor }: { editor: Editor }) {
  const comments = useComments(editor);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    try {
      const id = await comments.addComment(body);
      if (id) setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add comment.");
    }
  };

  return (
    <Popover
      open={comments.composer.open}
      onOpenChange={(open) => !open && comments.composer.close()}
    >
      <PopoverContent
        anchor={comments.composer.anchor ?? undefined}
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-72 gap-2 p-3"
      >
        <Textarea
          autoFocus
          value={draft}
          placeholder="Write a comment…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        />
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={comments.composer.close}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!draft.trim()} onClick={() => void submit()}>
            Comment
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
