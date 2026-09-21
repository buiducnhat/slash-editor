import type { LinkEditorState, LinkEditorStorage } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
// Import for its ambient `Commands<ReturnType>` augmentation (`setLink`/`unsetLink`) only —
// `@slash-editor/core`'s own public surface never re-exports it.
import type {} from "@tiptap/extension-link";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Minimal anchor accepted by floating-ui based popovers. */
export interface LinkEditorAnchor {
  getBoundingClientRect: () => DOMRect;
}

export interface LinkEditor extends LinkEditorState {
  /** Virtual anchor tracking the selection; `null` while closed. */
  anchor: LinkEditorAnchor | null;
  setHref: (href: string) => void;
  /** Applies `href` to the selection (or the link under the cursor) and closes. */
  confirm: () => void;
  /** Removes the link mark from the selection (or the link under the cursor) and closes. */
  remove: () => void;
  close: () => void;
}

const CLOSED: LinkEditorState = {
  open: false,
  href: "",
  editing: false,
  getClientRect: null,
};

const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

const noop = () => {};

function getStorage(editor: Editor | null): LinkEditorStorage | null {
  return editor?.storage.linkEditor ?? null;
}

/**
 * Subscribes to the link editor state owned by `@slash-editor/core`.
 *
 * `confirm`/`remove` are composed here, not as custom core commands: they
 * call the `link` mark's own `setLink`/`unsetLink` (from
 * `@tiptap/extension-link`) directly, the same way `BubbleToolbarItem.run`
 * calls `toggleBold` directly — core only owns popover visibility and the
 * draft href.
 */
export function useLinkEditor(editor: Editor | null): LinkEditor {
  const subscribe = useCallback(
    (listener: () => void) => getStorage(editor)?.subscribe(listener) ?? noop,
    [editor],
  );
  const getSnapshot = useCallback(() => getStorage(editor)?.state ?? CLOSED, [editor]);

  const state = useSyncExternalStore(subscribe, getSnapshot, () => CLOSED);

  const setHref = useCallback((href: string) => editor?.commands.setLinkEditorHref(href), [editor]);
  const close = useCallback(() => editor?.commands.closeLinkEditor(), [editor]);

  const confirm = useCallback(() => {
    if (!editor) {
      return;
    }
    const href = editor.storage.linkEditor.state.href.trim();
    if (!href) {
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    editor.commands.closeLinkEditor();
  }, [editor]);

  const remove = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.commands.closeLinkEditor();
  }, [editor]);

  const anchor = useMemo<LinkEditorAnchor | null>(() => {
    const { getClientRect } = state;

    if (!getClientRect) {
      return null;
    }

    return { getBoundingClientRect: () => getClientRect() ?? EMPTY_RECT };
  }, [state]);

  return { ...state, anchor, setHref, confirm, remove, close };
}
