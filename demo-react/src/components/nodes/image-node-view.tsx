import type { NodeViewProps } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { UploadableNodeView } from "@/components/nodes/uploadable-node-view.tsx";

export function ImageNodeView(props: NodeViewProps) {
  return (
    <UploadableNodeView
      {...props}
      accept="image/*"
      icon={ImageIcon}
      emptyLabel="Add an image"
      retry={(id, override) => props.editor.commands.retryImage(id, override)}
      renderReady={(attrs) => (
        <img
          src={attrs.src ?? undefined}
          alt={(props.node.attrs.alt as string | null) ?? ""}
          className="max-w-full rounded-md"
        />
      )}
    />
  );
}
