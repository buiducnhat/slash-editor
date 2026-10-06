import type { CommentMessage, CommentThread, CommentThreadStore } from "@slash-editor/core";

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

interface CommentStoreOptions {
  /** Shown as the author of every message this store creates. */
  author?: string;
  /**
   * `localStorage` key to persist threads under, so comments survive a reload
   * alongside the document that anchors them. Omit for an in-memory store.
   */
  storageKey?: string;
}

function readThreads(storageKey: string | undefined): CommentThread[] {
  if (!storageKey) return [];

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

    return Array.isArray(parsed) ? (parsed as CommentThread[]) : [];
  } catch {
    return [];
  }
}

/**
 * `CommentThreadStore` for the `comment` option. It keeps threads in memory
 * and, with `storageKey`, mirrors them to `localStorage`. Back the same
 * interface with your database to share threads between users.
 */
export function createCommentThreadStore({
  author = "You",
  storageKey,
}: CommentStoreOptions = {}): CommentThreadStore {
  const threads = new Map(readThreads(storageKey).map((thread) => [thread.id, thread]));
  const listeners = new Set<() => void>();

  function message(body: string): CommentMessage {
    return { id: nextId("msg"), author, body, createdAt: Date.now() };
  }

  function notify() {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...threads.values()]));
      } catch {
        // Quota or privacy mode: comments still work for this session.
      }
    }

    listeners.forEach((listener) => listener());
  }

  function getThreadOrThrow(threadId: string): CommentThread {
    const thread = threads.get(threadId);
    if (!thread) throw new Error(`Unknown comment thread: ${threadId}`);
    return thread;
  }

  return {
    createThread({ body }) {
      const thread: CommentThread = {
        id: nextId("thread"),
        status: "open",
        messages: [message(body)],
      };
      threads.set(thread.id, thread);
      notify();
      return thread;
    },
    addMessage(threadId, { body }) {
      const thread = getThreadOrThrow(threadId);
      thread.messages.push(message(body));
      notify();
      return thread;
    },
    resolveThread(threadId) {
      getThreadOrThrow(threadId).status = "resolved";
      notify();
    },
    reopenThread(threadId) {
      getThreadOrThrow(threadId).status = "open";
      notify();
    },
    getThread(threadId) {
      return threads.get(threadId);
    },
    listThreads() {
      return [...threads.values()];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
