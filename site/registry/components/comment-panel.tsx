import type { CommentThread, CommentThreadStore } from "@slash-editor/core";
import { useComments } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";

/**
 * Sidebar comment surface: composes `useComments` (anchors in the document,
 * owned by core) with a host `CommentThreadStore` (thread bodies, owned by
 * the host). Core never sees `store` — it only ever gets a `threadId`.
 */
export function CommentPanel({ editor, store }: { editor: Editor; store: CommentThreadStore }) {
  const comments = useComments(editor, { store });
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [draft, setDraft] = useState("");
  const canAdd = useEditorState({
    editor,
    selector: ({ editor: instance }) => !instance.state.selection.empty,
  });

  const refresh = async () => setThreads(await store.listThreads());

  useEffect(() => {
    // Re-list whenever the anchored threads under the selection change —
    // the cheapest signal available that the document's comments moved.
    void refresh();
  }, [comments.activeThreadIds.join(",")]);

  const submit = async () => {
    const body = draft.trim();
    if (!body) {
      return;
    }
    await comments.addComment(body);
    setDraft("");
    await refresh();
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
        {threads.map((thread) => {
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
                    onClick={async () => {
                      await comments.resolveThread(thread.id);
                      await refresh();
                    }}
                  >
                    Resolve
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await comments.reopenThread(thread.id);
                      await refresh();
                    }}
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
