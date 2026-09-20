import type { NodeViewProps } from "@tiptap/react";
import { PaperclipIcon } from "lucide-react";
import { UploadableNodeView } from "@/components/nodes/uploadable-node-view.tsx";

function formatSize(bytes: number | null): string | null {
  if (bytes == null) {
    return null;
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function FileNodeView(props: NodeViewProps) {
  const name = (props.node.attrs.name as string | null) ?? "Untitled file";
  const size = formatSize(props.node.attrs.size as number | null);

  return (
    <UploadableNodeView
      {...props}
      accept="*/*"
      icon={PaperclipIcon}
      emptyLabel="Add a file"
      retry={(id, override) => props.editor.commands.retryFile(id, override)}
      renderReady={(attrs) => (
        <a
          href={attrs.src ?? undefined}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-card hover:bg-muted/60 flex items-center gap-2 rounded-md border p-3 no-underline"
        >
          <PaperclipIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="flex-1 truncate text-sm font-medium">{name}</span>
          {size && <span className="text-muted-foreground text-xs">{size}</span>}
        </a>
      )}
    />
  );
}
