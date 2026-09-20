import type { Editor } from "@tiptap/core";
import { EditorContent, useEditorState, useSlashEditor } from "@slash-editor/react";
import { BlockHandle } from "@/components/block-handle.tsx";
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
<blockquote><p>Type <code>/</code> on an empty line to open the block menu.</p></blockquote>
<pre><code>const editor = useSlashEditor({ blockKit: { headingLevels: [1, 2, 3] } })</code></pre>
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
        </div>
      </div>
    </main>
  );
}
