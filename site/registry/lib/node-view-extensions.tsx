import { AiBlock, Embed, File as FileNode, Image, Video } from "@slash-editor/core";
import { type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { AiBlockNodeView } from "@/components/nodes/ai-block-node-view.tsx";
import { EmbedNodeView } from "@/components/nodes/embed-node-view.tsx";
import { FileNodeView } from "@/components/nodes/file-node-view.tsx";
import { ImageNodeView } from "@/components/nodes/image-node-view.tsx";
import { VideoNodeView } from "@/components/nodes/video-node-view.tsx";
import { mockUploadAdapter } from "@/lib/upload-adapter.ts";

/**
 * `image`/`file`/`video`'s `NodeView`s take their `UploadAdapter` as a prop
 * (never an internal import) so the shared chrome and per-type wrappers stay
 * registry-safe — this is the one place the playground's mock adapter is
 * actually wired in. A host swaps `mockUploadAdapter` for a real adapter
 * here, not inside the node-view files.
 */
export function nodeViewExtensions() {
  return [
    Image.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <ImageNodeView {...props} adapter={mockUploadAdapter} />
        )),
    }),
    FileNode.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <FileNodeView {...props} adapter={mockUploadAdapter} />
        )),
    }),
    Video.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <VideoNodeView {...props} adapter={mockUploadAdapter} />
        )),
    }),
    Embed.extend({ addNodeView: () => ReactNodeViewRenderer(EmbedNodeView) }),
    AiBlock.extend({ addNodeView: () => ReactNodeViewRenderer(AiBlockNodeView) }),
  ];
}
