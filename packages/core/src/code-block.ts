import {
  CodeBlockLowlight,
  type CodeBlockLowlightOptions,
} from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

export type CodeBlockOptions = CodeBlockLowlightOptions;

/** The lowlight instance type, for hosts that register extra grammars. */
export type Lowlight = ReturnType<typeof createLowlight>;

/**
 * Syntax-highlighted `codeBlock`: Tiptap's lowlight code block, standing in
 * for StarterKit's plain one. Same node name, attributes, commands and
 * markdown handling, so slash items, block types and markdown round-trips are
 * unchanged; highlighting is decoration-only, never written to the document.
 * Exported for `.extend()` so a UI layer can attach a `NodeView`.
 *
 * Tokens carry `hljs-*` classes, the one place the core emits class names:
 * the highlighter owns that vocabulary, and the UI layer themes it.
 */
export const CodeBlock = CodeBlockLowlight.extend<CodeBlockOptions>({
  // Baked into the node's own defaults, so `CodeBlock.extend({ addNodeView })`
  // keeps them: `extend` re-derives options from `addOptions`, never from a
  // prior `.configure()`.
  addOptions() {
    return { ...CodeBlockLowlight.options, lowlight: createLowlight(common) };
  },
});

/**
 * Configures the highlighted code block. Defaults to lowlight's `common`
 * grammar set (~37 languages); pass a `lowlight` instance to register more,
 * or fewer, to limit the languages offered.
 */
export function codeBlock(options: Partial<CodeBlockOptions> = {}) {
  return CodeBlock.configure(options);
}
