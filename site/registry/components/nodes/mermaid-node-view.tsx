import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper, useEditorState } from "@tiptap/react";
import { WorkflowIcon } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { renderMermaid, useThemeSnapshot } from "@/lib/mermaid.ts";
import { cn } from "@/lib/utils.ts";

const RENDER_DELAY_MS = 300;

interface Preview {
  svg: string | null;
  error: string | null;
}

/**
 * Preview by default; the source opens while the caret is inside the block,
 * with a live preview under it. The source is the node's own text
 * (`NodeViewContent`), so edits stay ordinary ProseMirror text — undo,
 * IME, and collaborative merging all behave as in any code block.
 */
export function MermaidNodeView({ editor, node, getPos }: NodeViewProps) {
  const source = node.textContent;
  const editing = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const pos = getPos();
      if (!current.isEditable || typeof pos !== "number") return false;
      const size = current.state.doc.nodeAt(pos)?.nodeSize ?? 0;
      const { from, to } = current.state.selection;
      return from > pos && to < pos + size;
    },
  });
  const theme = useThemeSnapshot();
  const previewRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [preview, setPreview] = useState<Preview>({ svg: null, error: null });

  useEffect(() => {
    const element = previewRef.current;
    const code = source.trim();
    if (!element || !code) return;

    let cancelled = false;
    // Render the first paint immediately; debounce the rest, which are keystrokes.
    const timer = setTimeout(
      () => {
        renderMermaid(code, element).then(
          (svg) => {
            renderedRef.current = true;
            if (!cancelled) setPreview({ svg, error: null });
          },
          (error: unknown) => {
            // Keep the last good diagram on screen while the source is mid-edit.
            if (!cancelled) {
              setPreview((previous) => ({
                svg: previous.svg,
                error: error instanceof Error ? error.message : String(error),
              }));
            }
          },
        );
      },
      renderedRef.current ? RENDER_DELAY_MS : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, theme]);

  const empty = !source.trim();
  const svg = empty ? null : preview.svg;
  const error = empty ? null : preview.error;
  const openSource = (event: MouseEvent) => {
    const pos = getPos();
    if (editing || !editor.isEditable || typeof pos !== "number") return;
    event.preventDefault();
    editor
      .chain()
      .focus()
      .setTextSelection(pos + node.nodeSize - 1)
      .run();
  };

  return (
    <NodeViewWrapper
      data-type="mermaid"
      data-editing={editing || undefined}
      className="border-border bg-card my-2 flex flex-col gap-2 rounded-md border p-2"
    >
      <pre hidden={!editing} className="my-0">
        <NodeViewContent<"code"> as="code" spellCheck={false} />
      </pre>
      <div
        ref={previewRef}
        contentEditable={false}
        onMouseDown={openSource}
        className={cn("flex flex-col items-center gap-2", !editing && "cursor-pointer")}
      >
        {svg ? (
          <div
            // Sanitised by Mermaid (`securityLevel: "strict"`), see `renderMermaid`.
            dangerouslySetInnerHTML={{ __html: svg }}
            className={cn(
              "flex w-full justify-center [&_svg]:h-auto [&_svg]:max-w-full",
              error && "opacity-50",
            )}
          />
        ) : empty ? (
          <p className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
            <WorkflowIcon className="size-4" />
            {editing ? "Type Mermaid source above" : "Empty diagram — click to add Mermaid source"}
          </p>
        ) : null}
        {error ? (
          <p className="text-destructive my-0 w-full font-mono text-xs whitespace-pre-wrap">
            {error}
          </p>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}
