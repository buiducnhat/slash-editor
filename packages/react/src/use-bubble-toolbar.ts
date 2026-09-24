import type {
  BubbleToolbarItem,
  BubbleToolbarState,
  BubbleToolbarStorage,
} from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useMemo } from "react";
import { useExtensionState } from "./use-extension-state.ts";
import { toVirtualAnchor, type VirtualAnchor } from "./virtual-anchor.ts";

export type BubbleToolbarAnchor = VirtualAnchor;

export interface BubbleToolbar extends BubbleToolbarState {
  anchor: VirtualAnchor | null;
}

const CLOSED: BubbleToolbarState = {
  open: false,
  items: [],
  getClientRect: null,
};

function getStorage(editor: Editor): BubbleToolbarStorage | null {
  return editor.storage.bubbleToolbar ?? null;
}

export function useBubbleToolbar(editor: Editor | null): BubbleToolbar {
  const state = useExtensionState(editor, getStorage, CLOSED);
  const anchor = useMemo(() => toVirtualAnchor(state.getClientRect), [state.getClientRect]);
  return { ...state, anchor };
}

export type { BubbleToolbarItem };
