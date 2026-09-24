import type { LinkEditorState, LinkEditorStorage } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import type {} from "@tiptap/extension-link";
import { useCallback } from "react";
import { useExtensionState } from "./use-extension-state.ts";
import { toVirtualAnchor, type VirtualAnchor } from "./virtual-anchor.ts";

export type LinkEditorAnchor = VirtualAnchor;

export interface LinkEditor extends LinkEditorState {
  anchor: VirtualAnchor | null;
  setHref: (href: string) => void;
  confirm: () => void;
  remove: () => void;
  close: () => void;
}

const CLOSED: LinkEditorState = { open: false, href: "", editing: false, getClientRect: null };

function getStorage(editor: Editor): LinkEditorStorage | null {
  return editor.storage.linkEditor ?? null;
}

export function useLinkEditor(editor: Editor | null): LinkEditor {
  const state = useExtensionState(editor, getStorage, CLOSED);
  const setHref = useCallback((href: string) => editor?.commands.setLinkEditorHref(href), [editor]);
  const close = useCallback(() => editor?.commands.closeLinkEditor(), [editor]);
  const confirm = useCallback(() => {
    if (!editor) return;
    const href = editor.storage.linkEditor.state.href.trim();
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    editor.commands.closeLinkEditor();
  }, [editor]);
  const remove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.commands.closeLinkEditor();
  }, [editor]);

  return {
    ...state,
    anchor: toVirtualAnchor(state.getClientRect),
    setHref,
    confirm,
    remove,
    close,
  };
}
