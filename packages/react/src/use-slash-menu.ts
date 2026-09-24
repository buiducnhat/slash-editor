import type { SlashCommandStorage, SlashItem, SlashMenuState } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo } from "react";
import { useExtensionState } from "./use-extension-state.ts";
import { toVirtualAnchor, type VirtualAnchor } from "./virtual-anchor.ts";

export type SlashMenuAnchor = VirtualAnchor;

export interface SlashMenu extends SlashMenuState {
  activeItem: SlashItem | null;
  anchor: VirtualAnchor | null;
  setActiveIndex: (index: number) => void;
  select: (index?: number) => void;
  close: () => void;
}

const CLOSED: SlashMenuState = {
  open: false,
  query: "",
  items: [],
  activeIndex: -1,
  getClientRect: null,
};

function getStorage(editor: Editor): SlashCommandStorage | null {
  return editor.storage.slashCommand ?? null;
}

export function useSlashMenu(editor: Editor | null): SlashMenu {
  const state = useExtensionState(editor, getStorage, CLOSED);
  const setActiveIndex = useCallback(
    (index: number) => (editor ? getStorage(editor)?.setActiveIndex(index) : undefined),
    [editor],
  );
  const select = useCallback(
    (index?: number) => (editor ? getStorage(editor)?.select(index) : undefined),
    [editor],
  );
  const close = useCallback(() => (editor ? getStorage(editor)?.close() : undefined), [editor]);
  const anchor = useMemo(() => toVirtualAnchor(state.getClientRect), [state.getClientRect]);

  return {
    ...state,
    activeItem: state.items[state.activeIndex] ?? null,
    anchor,
    setActiveIndex,
    select,
    close,
  };
}
