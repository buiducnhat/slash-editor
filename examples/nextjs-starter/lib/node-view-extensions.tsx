import { AiBlock, Embed, File as FileNode, Image, Mermaid, Video } from "@slash-editor/core";
import type { PagesOptions } from "@slash-editor/core";
import { CodeBlock } from "@slash-editor/core/code-block";
import { type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { AiBlockNodeView } from "@/components/nodes/ai-block-node-view.tsx";
import { CodeBlockNodeView } from "@/components/nodes/code-block-node-view.tsx";
import { EmbedNodeView } from "@/components/nodes/embed-node-view.tsx";
import { FileNodeView } from "@/components/nodes/file-node-view.tsx";
import { ImageNodeView } from "@/components/nodes/image-node-view.tsx";
import { MermaidNodeView } from "@/components/nodes/mermaid-node-view.tsx";
import { PageLinkNodeView, SubPageNodeView } from "@/components/nodes/page-node-views.tsx";
import { VideoNodeView } from "@/components/nodes/video-node-view.tsx";
import { uploadAdapter } from "@/lib/upload-adapter.ts";

/**
 * `image`/`file`/`video`'s `NodeView`s take their `UploadAdapter` as a prop
 * (never an internal import) so the shared chrome and per-type wrappers stay
 * registry-safe — this is the one place the starter's upload adapter is
 * actually wired in. A host swaps `uploadAdapter` for a real adapter
 * here, not inside the node-view files.
 */
export function nodeViewExtensions() {
  return [
    Image.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <ImageNodeView {...props} adapter={uploadAdapter} />
        )),
    }),
    FileNode.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <FileNodeView {...props} adapter={uploadAdapter} />
        )),
    }),
    Video.extend({
      addNodeView: () =>
        ReactNodeViewRenderer((props: NodeViewProps) => (
          <VideoNodeView {...props} adapter={uploadAdapter} />
        )),
    }),
    Embed.extend({ addNodeView: () => ReactNodeViewRenderer(EmbedNodeView) }),
    AiBlock.extend({ addNodeView: () => ReactNodeViewRenderer(AiBlockNodeView) }),
    Mermaid.extend({ addNodeView: () => ReactNodeViewRenderer(MermaidNodeView) }),
    CodeBlock.extend({ addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView) }),
  ];
}

/** `PagesOptions['nodeViews']` for `createBlockKit({ pages })`. */
export function pageNodeViews() {
  return {
    subPage: ReactNodeViewRenderer(SubPageNodeView),
    pageLink: ReactNodeViewRenderer(PageLinkNodeView),
  } satisfies NonNullable<PagesOptions["nodeViews"]>;
}
