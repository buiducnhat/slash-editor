import type { UploadAdapter } from "@slash-editor/core";
import type { NodeViewProps } from "@tiptap/react";
import { VideoIcon } from "lucide-react";
import { UploadableNodeView } from "@/components/nodes/uploadable-node-view";

export function VideoNodeView(props: NodeViewProps & { adapter: UploadAdapter }) {
  return (
    <UploadableNodeView
      {...props}
      accept="video/*"
      icon={VideoIcon}
      emptyLabel="Add a video"
      retry={(id, override) => props.editor.commands.retryVideo(id, override)}
      renderReady={(src) => (
        <video
          src={src}
          poster={(props.node.attrs.poster as string | null) ?? undefined}
          controls
          className="max-w-full rounded-md"
        />
      )}
    />
  );
}
