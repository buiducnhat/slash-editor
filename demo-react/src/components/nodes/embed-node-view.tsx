import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { LinkIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";

/**
 * No upload adapter here: an embed only ever needs a URL, set directly via
 * `updateAttributes` (built into every Tiptap node view). `image`/`file`/
 * `video` go through core's `retry<Type>` commands instead because those
 * carry an async `status` transition this node never has.
 */
export function EmbedNodeView({ node, updateAttributes }: NodeViewProps) {
  const url = node.attrs.url as string | null;
  const mode = node.attrs.mode as "bookmark" | "iframe";
  const title = node.attrs.title as string | null;
  const description = node.attrs.description as string | null;
  const [draft, setDraft] = useState("");

  if (!url) {
    const submit = () => {
      const value = draft.trim();
      if (value) {
        updateAttributes({ url: value });
      }
    };

    return (
      <NodeViewWrapper
        data-status="empty"
        className="border-border bg-muted/40 flex items-center gap-2 rounded-md border border-dashed p-3"
      >
        <LinkIcon className="text-muted-foreground size-4 shrink-0" />
        <Input
          value={draft}
          placeholder="Paste a link…"
          className="h-7 flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={submit}
        >
          Embed
        </Button>
      </NodeViewWrapper>
    );
  }

  if (mode === "iframe") {
    return (
      <NodeViewWrapper data-mode="iframe">
        <iframe
          src={url}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="border-border aspect-video w-full rounded-md border"
          title={title ?? url}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper data-mode="bookmark">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-card hover:bg-muted/60 flex flex-col gap-1 rounded-md border p-3 no-underline"
      >
        <span className="truncate text-sm font-medium">{title ?? url}</span>
        {description && (
          <span className="text-muted-foreground truncate text-xs">{description}</span>
        )}
        <span className="text-muted-foreground truncate text-xs">{url}</span>
      </a>
    </NodeViewWrapper>
  );
}
