import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import { cn } from "@/lib/utils.ts";

/**
 * The language list comes from the lowlight instance the extension was
 * configured with (`syntaxHighlight({ lowlight })`), so registering fewer or
 * more grammars changes the selector with no edit here. A language the
 * instance doesn't list by name — `js` from a markdown fence, say, which is an
 * alias — is kept as its own option rather than silently reset to Auto.
 */
function useLanguages(lowlight: { listLanguages: () => string[] }, current: string | null) {
  return useMemo(() => {
    const languages = lowlight.listLanguages().toSorted();
    return current && !languages.includes(current) ? [current, ...languages] : languages;
  }, [lowlight, current]);
}

/**
 * `ReactNodeViewRenderer` target for the lowlight-backed `codeBlock`: the
 * highlighted source plus a language selector pinned to the corner. The code
 * is the node's own text (`NodeViewContent`), so editing, undo and
 * collaboration behave as in any code block; only `language` is an attribute.
 */
export function CodeBlockNodeView({ editor, extension, node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? null;
  const languages = useLanguages(extension.options.lowlight, language);

  return (
    <NodeViewWrapper data-type="code-block" className="group relative">
      <select
        aria-label="Code language"
        contentEditable={false}
        disabled={!editor.isEditable}
        value={language ?? ""}
        onChange={(event) => updateAttributes({ language: event.target.value || null })}
        className={cn(
          "border-border bg-background text-muted-foreground absolute top-2 right-2 z-10 h-6 max-w-32 rounded-md border px-1.5 font-sans text-xs",
          "focus-visible:ring-foreground focus-visible:ring-2 focus-visible:outline-none",
          // Out of the way until the block is hovered or the selector has focus.
          "opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 disabled:hidden",
        )}
      >
        <option value="">Auto</option>
        {languages.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent<"code">
          as="code"
          spellCheck={false}
          className={language ? `language-${language}` : undefined}
        />
      </pre>
    </NodeViewWrapper>
  );
}
