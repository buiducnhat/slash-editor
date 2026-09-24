import type { Editor } from "@tiptap/core";
import type { BlockTarget } from "./block-drag.ts";

export interface BlockMenuContext {
  editor: Editor;
  target: BlockTarget;
}

export interface BlockMenuItem {
  id: string;
  title: string;
  icon: string;
  group: string;
  variant?: "default" | "destructive";
  when?: (context: BlockMenuContext) => boolean;
  run: (context: BlockMenuContext) => void | Promise<void>;
}

export const defaultBlockMenuItems: BlockMenuItem[] = [
  {
    id: "duplicate",
    title: "Duplicate",
    icon: "copy-plus",
    group: "edit",
    run: ({ editor, target }) => {
      editor.commands.duplicateBlock({ pos: target.pos, size: target.size });
    },
  },
  {
    id: "delete",
    title: "Delete",
    icon: "trash-2",
    group: "danger",
    variant: "destructive",
    run: ({ editor, target }) => {
      editor.commands.deleteBlock({ pos: target.pos, size: target.size });
    },
  },
];
