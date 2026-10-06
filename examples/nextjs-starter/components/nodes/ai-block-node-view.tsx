import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { CheckIcon, Loader2Icon, RotateCcwIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export function AiBlockNodeView({ node, editor }: NodeViewProps) {
  const id = node.attrs.id as string;
  const text = node.attrs.text as string;
  const status = node.attrs.status as "streaming" | "done" | "error";
  const error = node.attrs.error as string | null;

  return (
    <NodeViewWrapper
      data-status={status}
      contentEditable={false}
      className="border-border bg-muted/40 flex flex-col gap-2 rounded-lg border border-dashed p-3"
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <SparklesIcon />
        AI
        {status === "streaming" && <Loader2Icon className="animate-spin" />}
      </div>
      {status === "error" ? (
        <p className="text-destructive text-sm">{error ?? "AI request failed."}</p>
      ) : (
        <p className="text-foreground text-sm whitespace-pre-wrap">{text || "\u00A0"}</p>
      )}
      {status !== "streaming" ? (
        <div className="flex items-center gap-1.5">
          {status === "done" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => editor.commands.acceptAiAction(id, { mode: "replace" })}
              >
                <CheckIcon data-icon="inline-start" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => editor.commands.acceptAiAction(id, { mode: "insert" })}
              >
                <CheckIcon data-icon="inline-start" />
                Insert below
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.commands.retryAiAction(id)}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.commands.discardAiAction(id)}
          >
            <Trash2Icon data-icon="inline-start" />
            Discard
          </Button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
