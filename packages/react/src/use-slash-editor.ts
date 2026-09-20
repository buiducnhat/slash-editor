import { type BlockKitOptions, createBlockKit } from "@slash-editor/core";
import type { Editor, Extensions } from "@tiptap/core";
import { useEditor, type UseEditorOptions } from "@tiptap/react";
import { useRef } from "react";

export interface UseSlashEditorOptions extends Omit<UseEditorOptions, "extensions"> {
  /**
   * Baseline block schema options, or `false` to start from an empty schema
   * and supply everything through `extensions`.
   */
  blockKit?: BlockKitOptions | false;
  /** Extensions appended after the block kit. */
  extensions?: Extensions;
}

/**
 * Creates an editor with the slash-editor baseline schema.
 *
 * Defaults differ from `useEditor` in two ways:
 * - `immediatelyRender: false`, so the same component renders under SSR
 *   (Next.js App Router) without a hydration mismatch.
 * - extensions are resolved once per editor instance. ProseMirror cannot swap a
 *   schema on a live document, so later changes to `blockKit`/`extensions` are
 *   ignored rather than silently half-applied.
 */
export function useSlashEditor(options: UseSlashEditorOptions = {}): Editor | null {
  const { blockKit, extensions, ...editorOptions } = options;
  const resolved = useRef<Extensions | null>(null);

  resolved.current ??= [
    ...(blockKit === false ? [] : createBlockKit(blockKit)),
    ...(extensions ?? []),
  ];

  return useEditor({
    immediatelyRender: false,
    ...editorOptions,
    extensions: resolved.current,
  });
}
