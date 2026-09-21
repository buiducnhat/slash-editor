import type { CommentState, CommentStorage, CommentThreadStore } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useSyncExternalStore } from "react";

export interface UseCommentsOptions {
  /** Bring-your-own thread backend. Omit to read anchors without create/resolve support. */
  store?: CommentThreadStore;
}

export interface Comments extends CommentState {
  /**
   * Creates a thread through `store`, then anchors it over the current
   * selection in one focused chain. Returns `null` without `store` or a
   * non-empty selection.
   */
  addComment: (body: string) => Promise<string | null>;
  /** Marks `threadId` resolved through `store`. The anchor stays in the document. */
  resolveThread: (threadId: string) => Promise<void>;
  /** Reopens a resolved thread through `store`. */
  reopenThread: (threadId: string) => Promise<void>;
  /** Removes `threadId`'s anchor from the current selection, leaving the thread itself in `store`. */
  removeAnchor: (threadId: string) => void;
}

const EMPTY: CommentState = { activeThreadIds: [] };

const noop = () => {};

function getStorage(editor: Editor | null): CommentStorage | null {
  return editor?.storage.comment ?? null;
}

/**
 * Subscribes to the comment state owned by `@slash-editor/core` and
 * composes it with a host-provided `CommentThreadStore`, the same way
 * `useLinkEditor.confirm`/`.remove` compose core's popover state with the
 * `link` mark's own commands: core only anchors threads in the document,
 * a UI layer supplies where thread bodies actually live.
 */
export function useComments(editor: Editor | null, options: UseCommentsOptions = {}): Comments {
  const { store } = options;

  const subscribe = useCallback(
    (listener: () => void) => getStorage(editor)?.subscribe(listener) ?? noop,
    [editor],
  );
  const getSnapshot = useCallback(() => getStorage(editor)?.state ?? EMPTY, [editor]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const addComment = useCallback(
    async (body: string): Promise<string | null> => {
      if (!editor || !store || editor.state.selection.empty) {
        return null;
      }
      const thread = await store.createThread({ body });
      editor.chain().focus().setComment(thread.id).run();
      return thread.id;
    },
    [editor, store],
  );

  const resolveThread = useCallback(
    async (threadId: string) => {
      await store?.resolveThread(threadId);
    },
    [store],
  );

  const reopenThread = useCallback(
    async (threadId: string) => {
      await store?.reopenThread(threadId);
    },
    [store],
  );

  const removeAnchor = useCallback(
    (threadId: string) => {
      editor?.chain().focus().unsetComment(threadId).run();
    },
    [editor],
  );

  return { ...state, addComment, resolveThread, reopenThread, removeAnchor };
}
