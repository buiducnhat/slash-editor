import { Mark, mergeAttributes } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

/** A single reply in a comment thread. */
export interface CommentMessage {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

/** A comment thread as the host's store persists it. Bodies never enter the document. */
export interface CommentThread {
  id: string;
  status: "open" | "resolved";
  messages: CommentMessage[];
}

/**
 * Bring-your-own comment backend. Core anchors comments in the document
 * (the `comment` mark carries only a `threadId`); thread bodies, authors,
 * and resolution state live entirely outside the document in a host-owned
 * store, the same way `UploadAdapter`/`StreamAdapter` keep binary/model
 * work out of doc attrs. Deleting the anchored text drops the mark but
 * never the thread — an orphaned thread is a store-side concern, not a
 * document one.
 */
export interface CommentThreadStore {
  createThread(input: { body: string }): CommentThread | Promise<CommentThread>;
  addMessage(threadId: string, input: { body: string }): CommentThread | Promise<CommentThread>;
  resolveThread(threadId: string): void | Promise<void>;
  reopenThread(threadId: string): void | Promise<void>;
  getThread(threadId: string): CommentThread | undefined | Promise<CommentThread | undefined>;
  listThreads(): CommentThread[] | Promise<CommentThread[]>;
}

export interface CommentOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface CommentState {
  /** Distinct thread ids anchored under the current selection, in mark order. */
  activeThreadIds: string[];
}

export interface CommentStorage {
  state: CommentState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** Subscribes to selection-driven comment state. Returns an unsubscribe function. */
  subscribe(this: CommentStorage, listener: () => void): () => void;
  /** @internal Replaces state and notifies subscribers, skipping no-op empty transitions. */
  setState(this: CommentStorage, next: CommentState): void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      /** Anchors `threadId` over the current selection. */
      setComment: (threadId: string) => ReturnType;
      /** Removes only `threadId`'s anchors from the current selection. */
      unsetComment: (threadId: string) => ReturnType;
      /** Anchors `threadId` if absent from the selection, removes it if present. */
      toggleComment: (threadId: string) => ReturnType;
    };
  }
  interface Storage {
    comment: CommentStorage;
  }
}

const EMPTY_STATE: CommentState = Object.freeze({ activeThreadIds: [] });

/**
 * Distinct `threadId`s anchored under `state`'s selection: every mark
 * instance touching a non-empty range, or the marks that would apply to
 * text typed at a collapsed cursor. Pure and DOM-free so it is testable
 * against a bare `EditorState`.
 */
export function activeThreadIds(state: EditorState): string[] {
  const markType = state.schema.marks.comment;
  if (!markType) {
    return [];
  }

  const { selection } = state;
  const ids = new Set<string>();

  if (selection.empty) {
    const marks = state.storedMarks ?? selection.$from.marks();
    for (const mark of marks) {
      if (mark.type === markType) {
        ids.add(mark.attrs.threadId as string);
      }
    }
    return [...ids];
  }

  state.doc.nodesBetween(selection.from, selection.to, (node) => {
    for (const mark of node.marks) {
      if (mark.type === markType) {
        ids.add(mark.attrs.threadId as string);
      }
    }
  });
  return [...ids];
}

/**
 * Comment anchors are a mark, not a node: `threadId` is the only attribute,
 * so multiple distinct threads can anchor overlapping ranges (`excludes:
 * ""` opts out of ProseMirror's default same-type exclusion). Thread
 * bodies, authors, and resolved state never live here — see
 * `CommentThreadStore`.
 */
export const Comment = Mark.create<CommentOptions, CommentStorage>({
  name: "comment",
  excludes: "",
  inclusive: false,

  addOptions() {
    return { HTMLAttributes: {} };
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

  // Methods read and write through `this` because Tiptap hands each editor
  // its own storage object; closing over a local would update the wrong copy.
  addStorage() {
    return {
      state: EMPTY_STATE,
      listeners: new Set<() => void>(),

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },

      setState(next) {
        if (this.state.activeThreadIds.length === 0 && next.activeThreadIds.length === 0) {
          return;
        }
        this.state = next;
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  addCommands() {
    return {
      setComment:
        (threadId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { threadId }),

      unsetComment:
        (threadId: string) =>
        ({ tr, state, dispatch }) => {
          const markType = state.schema.marks[this.name];
          if (!markType) {
            return false;
          }
          if (dispatch) {
            const { from, to } = state.selection;
            tr.removeMark(from, to, markType.create({ threadId }));
          }
          return true;
        },

      toggleComment:
        (threadId: string) =>
        ({ state, commands }) =>
          activeThreadIds(state).includes(threadId)
            ? commands.unsetComment(threadId)
            : commands.setComment(threadId),
    };
  },

  onTransaction() {
    this.storage.setState({ activeThreadIds: activeThreadIds(this.editor.state) });
  },
});

/** Configures the comment mark. */
export function comment(options: Partial<CommentOptions> = {}) {
  return Comment.configure(options);
}
