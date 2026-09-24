import type { BlockType } from "@slash-editor/core";
import { defaultBlockTypes } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo } from "react";

export interface BlockTypes {
  items: BlockType[];
  active: BlockType | null;
  convert: (type: BlockType, pos?: number) => boolean;
}

export function useBlockTypes(editor: Editor | null): BlockTypes {
  const items = useMemo(
    () => editor?.storage.blockTypes?.types ?? (editor ? defaultBlockTypes : []),
    [editor],
  );
  const active = useMemo(
    () =>
      items.find((type) => editor && (type.when?.(editor) ?? true) && type.isActive(editor)) ??
      null,
    [editor, items],
  );
  const convert = useCallback(
    (type: BlockType, pos?: number) => (editor ? type.convert({ editor, pos }) : false),
    [editor],
  );
  return { items, active, convert };
}
