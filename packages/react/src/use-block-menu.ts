import type { BlockMenuItem, BlockTarget } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useMemo } from "react";
import { defaultBlockMenuItems } from "@slash-editor/core";
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
  const items = useMemo(
    () =>
      drag.menuTarget
        ? defaultBlockMenuItems.filter(
            (item) => item.when?.({ editor: editor!, target: drag.menuTarget! }) ?? true,
          )
        : defaultBlockMenuItems,
    [drag.menuTarget, editor],
  );

  return {
    items,
    target: drag.menuTarget,
    anchor: drag.menuAnchor,
    close: drag.closeMenu,
    handleProps: drag.handleProps,
  };
}
