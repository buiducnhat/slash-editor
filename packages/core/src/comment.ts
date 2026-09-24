import { Mark, mergeAttributes, posToDOMRect } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

export interface CommentMessage {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export interface CommentThread {
  id: string;
  status: "open" | "resolved";
  messages: CommentMessage[];
}

/** Host-owned persistence for thread bodies. Document marks carry only the thread id. */
export interface CommentThreadStore {
  createThread(input: { body: string }): CommentThread | Promise<CommentThread>;
  addMessage(threadId: string, input: { body: string }): CommentThread | Promise<CommentThread>;
  resolveThread(threadId: string): void | Promise<void>;
  reopenThread(threadId: string): void | Promise<void>;
  getThread(threadId: string): CommentThread | undefined | Promise<CommentThread | undefined>;
  listThreads(): CommentThread[] | Promise<CommentThread[]>;
  /** Notifies consumers after local or remote thread changes. */
  subscribe(listener: () => void): () => void;
}

export interface CommentOptions {
  HTMLAttributes: Record<string, unknown>;
  store?: CommentThreadStore;
}

export interface CommentComposerState {
  open: boolean;
  getClientRect: (() => DOMRect | null) | null;
}

export interface CommentState {
  activeThreadIds: string[];
  composer: CommentComposerState;
}

export interface CommentStorage {
  state: CommentState;
  store?: CommentThreadStore;
  listeners: Set<() => void>;
  subscribe(this: CommentStorage, listener: () => void): () => void;
  setState(this: CommentStorage, next: CommentState): void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      setComment: (threadId: string) => ReturnType;
      unsetComment: (threadId: string) => ReturnType;
      toggleComment: (threadId: string) => ReturnType;
      openCommentComposer: () => ReturnType;
      closeCommentComposer: () => ReturnType;
    };
  }
  interface Storage {
    comment: CommentStorage;
  }
}

const CLOSED_COMPOSER: CommentComposerState = Object.freeze({ open: false, getClientRect: null });
const EMPTY_STATE: CommentState = Object.freeze({ activeThreadIds: [], composer: CLOSED_COMPOSER });

/** Distinct thread ids anchored under the selection. */
export function activeThreadIds(state: EditorState): string[] {
  const markType = state.schema.marks.comment;
  if (!markType) return [];

  const { selection } = state;
  const ids = new Set<string>();
  if (selection.empty) {
    for (const mark of state.storedMarks ?? selection.$from.marks()) {
      if (mark.type === markType) ids.add(mark.attrs.threadId as string);
    }
    return [...ids];
  }

  state.doc.nodesBetween(selection.from, selection.to, (node) => {
    for (const mark of node.marks) {
      if (mark.type === markType) ids.add(mark.attrs.threadId as string);
    }
  });
  return [...ids];
}

export const Comment = Mark.create<CommentOptions, CommentStorage>({
  name: "comment",
  excludes: "",
  inclusive: false,

  addOptions() {
    return { HTMLAttributes: {}, store: undefined };
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-thread-id"),
        renderHTML: (attributes) =>
          attributes.threadId ? { "data-thread-id": attributes.threadId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      0,
    ];
  },

  addStorage() {
    return {
      state: EMPTY_STATE,
      store: this.options.store,
      listeners: new Set<() => void>(),
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
      setState(next) {
        const sameIds =
          this.state.activeThreadIds.length === next.activeThreadIds.length &&
          this.state.activeThreadIds.every((id, index) => id === next.activeThreadIds[index]);
        const sameComposer =
          this.state.composer.open === next.composer.open &&
          this.state.composer.getClientRect === next.composer.getClientRect;
        if (sameIds && sameComposer) return;
        this.state = next;
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  addCommands() {
    return {
      setComment:
        (threadId) =>
        ({ commands }) =>
          commands.setMark(this.name, { threadId }),
      unsetComment:
        (threadId) =>
        ({ tr, state, dispatch }) => {
          const markType = state.schema.marks[this.name];
          if (!markType) return false;
          if (dispatch) {
            const { from, to } = state.selection;
            tr.removeMark(from, to, markType.create({ threadId }));
          }
          return true;
        },
      toggleComment:
        (threadId) =>
        ({ state, commands }) =>
          activeThreadIds(state).includes(threadId)
            ? commands.unsetComment(threadId)
            : commands.setComment(threadId),
      openCommentComposer:
        () =>
        ({ state }) => {
          const { selection } = state;
          if (!this.storage.store || selection.empty) return false;
          const { from, to } = selection;
          this.storage.setState({
            activeThreadIds: activeThreadIds(state),
            composer: {
              open: true,
              getClientRect: () => posToDOMRect(this.editor.view, from, to),
            },
          });
          return true;
        },
      closeCommentComposer:
        () =>
        ({ state }) => {
          this.storage.setState({
            activeThreadIds: activeThreadIds(state),
            composer: CLOSED_COMPOSER,
          });
          return true;
        },
    };
  },

  onTransaction() {
    const composer = this.storage.state.composer;
    this.storage.setState({
      activeThreadIds: activeThreadIds(this.editor.state),
      composer: composer.open ? composer : CLOSED_COMPOSER,
    });
  },
});

export function comment(options: Partial<CommentOptions> = {}) {
  return Comment.configure(options);
}
