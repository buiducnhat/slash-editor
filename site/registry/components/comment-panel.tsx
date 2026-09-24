import { useComments } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";

export function CommentPanel({ editor }: { editor: Editor }) {
  const comments = useComments(editor);
  const [draft, setDraft] = useState("");
  const canAdd = useEditorState({
    editor,
    selector: ({ editor: instance }) => !instance.state.selection.empty,
  });

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    const id = await comments.addComment(body);
    if (id) setDraft("");
  };

  return (
    <aside className="border-border flex w-72 shrink-0 flex-col gap-3 border-l p-4">
      <h2 className="text-sm font-medium">Comments</h2>
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          placeholder={canAdd ? "Comment on the selection…" : "Select text to comment"}
          disabled={!canAdd}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          size="sm"
          disabled={!canAdd || !draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={submit}
        >
          Comment
        </Button>
      </div>
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {comments.threads.map((thread) => {
          const active = comments.activeThreadIds.includes(thread.id);
          return (
            <li
              key={thread.id}
              data-testid="comment-thread"
              data-thread-id={thread.id}
              data-active={active || undefined}
              className={cn(
                "border-border rounded-md border p-2 text-sm",
                active && "border-primary",
              )}
            >
              <p className="text-muted-foreground text-xs">{thread.status}</p>
              {thread.messages.map((entry) => (
                <p key={entry.id}>{entry.body}</p>
              ))}
              <div className="flex gap-1 pt-1">
                {thread.status === "open" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => comments.resolveThread(thread.id)}
                  >
                    Resolve
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => comments.reopenThread(thread.id)}
                  >
                    Reopen
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => comments.removeAnchor(thread.id)}>
                  Remove anchor
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
