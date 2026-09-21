import type { CommentMessage, CommentThread, CommentThreadStore } from "@slash-editor/core";

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/**
 * In-memory `CommentThreadStore` for the playground. A real deployment
 * swaps this for a fetch-backed adapter — `@slash-editor/core` only ever
 * anchors a `threadId` in the document; it never calls this interface
 * itself, `useComments` (`@slash-editor/react`) does.
 */
export function createMockCommentThreadStore(author = "You"): CommentThreadStore {
  const threads = new Map<string, CommentThread>();

  function message(body: string): CommentMessage {
    return { id: nextId("msg"), author, body, createdAt: Date.now() };
  }

  function getThreadOrThrow(threadId: string): CommentThread {
    const thread = threads.get(threadId);
    if (!thread) {
      throw new Error(`Unknown comment thread: ${threadId}`);
    }
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
      return thread;
    },
    addMessage(threadId, { body }) {
      const thread = getThreadOrThrow(threadId);
      thread.messages.push(message(body));
      return thread;
    },
    resolveThread(threadId) {
      getThreadOrThrow(threadId).status = "resolved";
    },
    reopenThread(threadId) {
      getThreadOrThrow(threadId).status = "open";
    },
    getThread(threadId) {
      return threads.get(threadId);
    },
    listThreads() {
      return [...threads.values()];
    },
  };
}
