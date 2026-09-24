import type {
  CommentState,
  CommentStorage,
  CommentThread,
  CommentThreadStore,
} from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import { useExtensionState } from "./use-extension-state.ts";
import { toVirtualAnchor, type VirtualAnchor } from "./virtual-anchor.ts";

export interface CommentComposer {
  open: boolean;
  anchor: VirtualAnchor | null;
  close: () => void;
}

export interface Comments extends Omit<CommentState, "composer"> {
  composer: CommentComposer;
  threads: CommentThread[];
  addComment: (body: string) => Promise<string | null>;
  resolveThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  removeAnchor: (threadId: string) => void;
}

const EMPTY: CommentState = {
  activeThreadIds: [],
  composer: { open: false, getClientRect: null },
};

function getStorage(editor: Editor): CommentStorage | null {
  return editor.storage.comment ?? null;
}

export function useComments(editor: Editor | null): Comments {
  const state = useExtensionState(editor, getStorage, EMPTY);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const store: CommentThreadStore | undefined = editor?.storage.comment?.store;

  useEffect(() => {
    if (!store) {
      setThreads([]);
      return;
    }
    let active = true;
    const refresh = () => {
      void Promise.resolve(store.listThreads()).then((next) => {
        if (active) setThreads(next);
      });
    };
    refresh();
    const unsubscribe = store.subscribe(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [store]);

  const addComment = useCallback(
    async (body: string): Promise<string | null> => {
      if (!editor || !store || editor.state.selection.empty) return null;
      const thread = await store.createThread({ body });
      editor.chain().focus().setComment(thread.id).run();
      editor.commands.closeCommentComposer();
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
    (threadId: string) => editor?.chain().focus().unsetComment(threadId).run(),
    [editor],
  );
  const close = useCallback(() => editor?.commands.closeCommentComposer(), [editor]);

  return {
    ...state,
    threads,
    composer: {
      open: state.composer.open,
      anchor: toVirtualAnchor(state.composer.getClientRect),
      close,
    },
    addComment,
    resolveThread,
    reopenThread,
    removeAnchor,
  };
}
