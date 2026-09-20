import type { UploadAdapter, UploadStatus } from "@slash-editor/core";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { RotateCcwIcon, UploadIcon, type LucideIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button.tsx";
import { mockUploadAdapter } from "@/lib/upload-adapter.ts";

interface UploadableNodeAttrs {
  id: string;
  src: string | null;
  status: UploadStatus;
  error: string | null;
}

interface UploadableNodeViewProps extends NodeViewProps {
  /** Native file input `accept` filter. */
  accept: string;
  icon: LucideIcon;
  emptyLabel: string;
  /** `editor.commands.retry<Type>` — bound by the per-node wrapper so this stays generic. */
  retry: (id: string, override?: { file: File; adapter: UploadAdapter }) => boolean;
  /** Renders the node once it has a `src` (ready or mid-retry after a prior success). */
  renderReady: (attrs: UploadableNodeAttrs) => ReactNode;
}

/**
 * Shared placeholder/progress/error chrome for `image`/`file`/`video`
 * node views: core carries `status`/`error` in doc attrs (see `upload.ts`),
 * this renders them and drives `retry<Type>` — the demo's only job is
 * picking a `File` and an adapter; core owns the upload/retry mechanics.
 */
export function UploadableNodeView(props: UploadableNodeViewProps) {
  const { node, accept, icon: Icon, emptyLabel, retry, renderReady } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const attrs = node.attrs as UploadableNodeAttrs;

  if (attrs.src) {
    return (
      <NodeViewWrapper data-status={attrs.status} className="group relative">
        {renderReady(attrs)}
        {attrs.status === "error" && (
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute top-2 right-2"
            aria-label="Retry upload"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => retry(attrs.id)}
          >
            <RotateCcwIcon />
          </Button>
        )}
      </NodeViewWrapper>
    );
  }

  const message =
    attrs.status === "uploading"
      ? "Uploading…"
      : attrs.status === "error"
        ? (attrs.error ?? "Upload failed")
        : emptyLabel;

  return (
    <NodeViewWrapper
      data-status={attrs.status}
      data-error={attrs.error ?? undefined}
      className="border-border bg-muted/40 text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-4"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate text-sm">{message}</span>
      {attrs.status === "error" ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => retry(attrs.id)}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Retry
        </Button>
      ) : attrs.status !== "uploading" ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          Upload
        </Button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) {
            return;
          }
          retry(attrs.id, { file, adapter: mockUploadAdapter });
        }}
      />
    </NodeViewWrapper>
  );
}
