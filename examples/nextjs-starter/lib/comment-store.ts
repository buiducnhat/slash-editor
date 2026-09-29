import type { CommentMessage, CommentThread, CommentThreadStore } from "@slash-editor/core";

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function createMockCommentThreadStore(author = "You"): CommentThreadStore {
  const threads = new Map<string, CommentThread>();
  const listeners = new Set<() => void>();

  function message(body: string): CommentMessage {
    return { id: nextId("msg"), author, body, createdAt: Date.now() };
  }

  function notify() {
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
