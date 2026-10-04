import type { BlockMenuItem, BlockTarget } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useMemo } from "react";
import { defaultBlockMenuItems, localizeBlockMenuItems } from "@slash-editor/core";
import { useBlockDrag } from "./use-block-drag.ts";

export interface BlockMenu {
  items: BlockMenuItem[];
  target: BlockTarget | null;
  anchor: ReturnType<typeof useBlockDrag>["menuAnchor"];
  close: () => void;
  handleProps: ReturnType<typeof useBlockDrag>["handleProps"];
}

export function useBlockMenu(editor: Editor | null): BlockMenu {
  const drag = useBlockDrag(editor);
  const messages = editor?.storage.messages?.messages;
  const items = useMemo(() => {
    const localized = localizeBlockMenuItems(defaultBlockMenuItems, messages);

    return drag.menuTarget
      ? localized.filter(
          (item) => item.when?.({ editor: editor!, target: drag.menuTarget! }) ?? true,
        )
      : localized;
  }, [drag.menuTarget, editor, messages]);

  return {
    items,
    target: drag.menuTarget,
    anchor: drag.menuAnchor,
    close: drag.closeMenu,
    handleProps: drag.handleProps,
  };
}
