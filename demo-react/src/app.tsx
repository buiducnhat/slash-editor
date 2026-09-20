import { Embed, File as FileNode, Image, Video } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditorState, useSlashEditor } from "@slash-editor/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BlockHandle } from "@/components/block-handle.tsx";
import { BubbleToolbar } from "@/components/bubble-toolbar.tsx";
import { EmbedNodeView } from "@/components/nodes/embed-node-view.tsx";
import { FileNodeView } from "@/components/nodes/file-node-view.tsx";
import { ImageNodeView } from "@/components/nodes/image-node-view.tsx";
import { VideoNodeView } from "@/components/nodes/video-node-view.tsx";
import { SlashMenu } from "@/components/slash-menu.tsx";
import { cn } from "@/lib/utils.ts";

const INITIAL_CONTENT = `
<h1>slash-editor</h1>
<p>Notion-style block editing on a headless core, styled with shadcn tokens.</p>
<h2>Baseline schema</h2>
<ul>
  <li><p>Headings, lists, quotes, code, rules</p></li>
  <li><p>Markdown input rules: type <code># </code>, <code>- </code>, or <code>&gt; </code></p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Ship the slash menu</p></li>
  <li data-type="taskItem" data-checked="false"><p>Ship callout, toggle, and task-list nodes</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>Callouts wrap block content in a highlighted aside.</p></div>
<details>
  <summary>Toggle lists collapse content</summary>
  <div data-type="detailsContent"><p>Type <code>/toggle</code> to insert one.</p></div>
</details>
<blockquote><p>Type <code>/</code> on an empty line to open the block menu.</p></blockquote>
<pre><code>const editor = useSlashEditor({ blockKit: { headingLevels: [1, 2, 3] } })</code></pre>
<h2>Media &amp; structure</h2>
<p>Type <code>/image</code>, <code>/file</code>, or <code>/video</code> for an upload placeholder with retry on failure.</p>
<a data-type="embed" data-mode="bookmark" href="https://tiptap.dev" data-title="Tiptap" data-description="The headless editor framework this project builds on.">Tiptap</a>
<div data-type="columns">
  <div data-type="column"><p>Columns are a container node: side-by-side content that still nests through the same drag/drop rules as lists.</p></div>
  <div data-type="column"><p>Type <code>/columns</code> to insert a new side-by-side layout.</p></div>
</div>
<table>
  <tbody>
    <tr><th><p>Node</p></th><th><p>Adapter</p></th></tr>
    <tr><td><p>Image / File / Video</p></td><td><p>UploadAdapter</p></td></tr>
    <tr><td><p>Embed</p></td><td><p>None — direct URL</p></td></tr>
  </tbody>
</table>
`;

/** Rendered only once the editor exists, so the stats subscribe to a live instance. */
function DocumentStats({ editor }: { editor: Editor }) {
  const stats = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      words: instance.getText().split(/\s+/).filter(Boolean).length,
      blocks: instance.state.doc.childCount,
    }),
  });

  return (
    <p className="text-muted-foreground text-xs tabular-nums">
      {stats.blocks} blocks · {stats.words} words
    </p>
  );
}

export function App() {
  const editor = useSlashEditor({
    content: INITIAL_CONTENT,
    blockKit: {
      image: false,
      file: false,
      video: false,
      embed: false,
      extend: [
        Image.extend({ addNodeView: () => ReactNodeViewRenderer(ImageNodeView) }),
        FileNode.extend({ addNodeView: () => ReactNodeViewRenderer(FileNodeView) }),
        Video.extend({ addNodeView: () => ReactNodeViewRenderer(VideoNodeView) }),
        Embed.extend({ addNodeView: () => ReactNodeViewRenderer(EmbedNodeView) }),
      ],
    },
    editorProps: {
      attributes: {
        class: "slash-content min-h-[60vh] pl-20 pr-10 py-8",
        "aria-label": "Document",
      },
    },
  });

  return (
    <main className="bg-background min-h-screen py-12">
      <div className="mx-auto w-full max-w-3xl px-6">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-sm font-medium tracking-tight">slash-editor playground</h1>
          {editor && <DocumentStats editor={editor} />}
        </header>

        <div
          className={cn(
            "bg-card border-border rounded-xl border shadow-sm",
            "focus-within:ring-ring/40 focus-within:ring-2",
          )}
        >
          <EditorContent editor={editor} />
          {editor && <SlashMenu editor={editor} />}
          {editor && <BlockHandle editor={editor} />}
          {editor && <BubbleToolbar editor={editor} />}
        </div>
      </div>
    </main>
  );
}
