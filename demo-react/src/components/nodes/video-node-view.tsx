import type { NodeViewProps } from "@tiptap/react";
import { VideoIcon } from "lucide-react";
import { UploadableNodeView } from "@/components/nodes/uploadable-node-view.tsx";

export function VideoNodeView(props: NodeViewProps) {
  return (
    <UploadableNodeView
      {...props}
      accept="video/*"
      icon={VideoIcon}
      emptyLabel="Add a video"
      retry={(id, override) => props.editor.commands.retryVideo(id, override)}
      renderReady={(attrs) => (
        <video
          src={attrs.src ?? undefined}
          poster={(props.node.attrs.poster as string | null) ?? undefined}
          controls
          className="max-w-full rounded-md"
        />
      )}
    />
  );
}
