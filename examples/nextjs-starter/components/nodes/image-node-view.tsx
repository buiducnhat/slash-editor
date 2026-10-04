import type { UploadAdapter } from "@slash-editor/core";
import type { NodeViewProps } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { UploadableNodeView } from "@/components/nodes/uploadable-node-view";

export function ImageNodeView(props: NodeViewProps & { adapter: UploadAdapter }) {
  return (
    <UploadableNodeView
      {...props}
      accept="image/*"
      icon={ImageIcon}
      emptyLabel="Add an image"
      retry={(id, override) => props.editor.commands.retryImage(id, override)}
      renderReady={(src) => (
        <img
          src={src}
          alt={(props.node.attrs.alt as string | null) ?? ""}
          className="max-w-full rounded-md"
        />
      )}
    />
  );
}
