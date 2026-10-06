"use client";

import { useAiActions, useEditorState } from "@slash-editor/react";
import type { AiAction } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { AlertTriangleIcon, PenLineIcon, SparklesIcon } from "lucide-react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { EditorSurface } from "@/components/editor-surface.tsx";
import { Button } from "@/components/ui/button.tsx";
import { BLOCK_KIT, EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

/** A context containing this marker makes `/api/ai` fail once per action. */
const AI_ERROR_MARKER = "trigger-ai-error";

const AI_DRAFT = `
<h1>Notes on shipping a block editor</h1>
<p>our team spent the last quarter replacing a rich-text field with a block editor. here is what we learnd along the way.</p>
<p>The biggest surprise was how much of the work was not the editor itself. Menus, uploads, comments and permissions each needed a small contract with the backend, and writing those contracts down early saved us from rewriting the same glue three times.</p>
<h2>Try the failure path</h2>
<p>This paragraph contains the marker ${AI_ERROR_MARKER}, so any selection or block action that sends it fails once before succeeding on retry.</p>
<p>Put the caret on an empty line below and type <code>/continue-writing</code>.</p>
`;

const CONTEXT_LABELS = { slash: "Slash", selection: "Selection", block: "Block handle" } as const;

/** Selects the text of the paragraph that carries the failure marker. */
function selectFailingParagraph(editor: Editor) {
  let range: { from: number; to: number } | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (!range && node.isTextblock && node.textContent.includes(AI_ERROR_MARKER)) {
      range = { from: pos + 1, to: pos + node.nodeSize - 1 };
    }
    return !range;
  });

  if (range) editor.chain().focus().setTextSelection(range).run();
}

/** Keeps the editor's selection alive while a toolbar button is pressed. */
const keepSelection = (event: React.MouseEvent) => event.preventDefault();

function ActionBar({ editor }: { editor: Editor }) {
  const slash = useAiActions(editor, "slash");
  const selection = useAiActions(editor, "selection");
  const hasSelection = useEditorState({
    editor,
    selector: ({ editor: instance }) => !instance.state.selection.empty,
  });

  const button = (action: AiAction, run: (action: AiAction) => boolean, enabled: boolean) => (
    <Button
      key={action.id}
      variant="outline"
      size="sm"
      disabled={!enabled}
      title={action.description}
      onMouseDown={keepSelection}
      onClick={() => run(action)}
    >
      {action.title}
    </Button>
  );

  return (
    <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-24 text-xs font-medium">At the caret</span>
        {slash.actions.map((action) => button(action, slash.run, true))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-24 text-xs font-medium">On selection</span>
        {selection.actions.map((action) => button(action, selection.run, hasSelection))}
        {!hasSelection && (
          <span className="text-muted-foreground text-xs">Select some text to enable these.</span>
        )}
      </div>
      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-3">
        <Button variant="secondary" size="sm" onClick={() => selectFailingParagraph(editor)}>
          <AlertTriangleIcon data-icon="inline-start" />
          Select the failing paragraph
        </Button>
        <span className="text-muted-foreground text-xs">
          Then run any selection action: the request fails once and offers Try again.
        </span>
      </div>
    </div>
  );
}

function ActionLegend({ editor }: { editor: Editor }) {
  const actions: AiAction[] = editor.storage.ai?.actions ?? [];

  return (
    <section aria-labelledby="ai-actions" className="flex flex-col gap-2">
      <h2 id="ai-actions" className="text-sm font-medium">
        Actions
      </h2>
      <ul className="flex flex-col gap-2">
        {actions.map((action) => (
          <li key={action.id} className="flex flex-col gap-1">
            <span className="text-sm">{action.title}</span>
            <span className="flex flex-wrap gap-1">
              {action.contexts.map((context) => (
                <span
                  key={context}
                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px]"
                >
                  {CONTEXT_LABELS[context]}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AiDemo() {
  const editor = useDemoEditor({
    content: AI_DRAFT,
    blockKit: BLOCK_KIT,
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "AI draft" } },
  });

  return (
    <>
      <DemoHeader
        title="AI writing"
        description={
          <>
            Type <code>/</code> and pick an AI action, select text to use Ask AI in the
            bubble toolbar, or open a block&apos;s handle menu. Results stream into a transient
            block you can keep, replace the source with, retry or discard.
          </>
        }
      />
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {editor && <ActionBar editor={editor} />}
          <EditorSurface editor={editor} comments={false} />
        </div>
        <aside className="border-border sticky top-20 hidden max-h-[calc(100vh-6rem)] w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l pl-6 lg:flex">
          {editor && <ActionLegend editor={editor} />}
          <section aria-labelledby="ai-backend" className="flex flex-col gap-2 text-sm">
            <h2 id="ai-backend" className="flex items-center gap-1.5 font-medium">
              <SparklesIcon className="size-4" aria-hidden />
              How it&apos;s wired
            </h2>
            <p className="text-muted-foreground">
              <code>streamAdapter</code> in <code>lib/stream-adapter.ts</code> POSTs an{" "}
              <code>AiRequest</code> (<code>action</code>, <code>prompt</code>,{" "}
              <code>context</code>, <code>scope</code>) to <code>/api/ai</code> and yields the
              plain-text response as it arrives.
            </p>
            <p className="text-muted-foreground">
              The route answers with canned text per action. To use a real model, replace{" "}
              <code>generate</code> in <code>app/api/ai/route.ts</code>: build a prompt from the
              request and yield each text delta your provider returns.
            </p>
          </section>
          <section aria-labelledby="ai-retry" className="flex flex-col gap-2 text-sm">
            <h2 id="ai-retry" className="flex items-center gap-1.5 font-medium">
              <PenLineIcon className="size-4" aria-hidden />
              Failure path
            </h2>
            <p className="text-muted-foreground">
              A request whose context contains <code>{AI_ERROR_MARKER}</code> fails once per
              action. The result block shows the error with Try again, which replays the request.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
