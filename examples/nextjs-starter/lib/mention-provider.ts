import type { MentionItem } from "@slash-editor/core";

/** In-memory directory the mock mention provider searches. */
const DIRECTORY: MentionItem[] = [
  { id: "1", label: "Ada Lovelace", description: "ada@example.com" },
  { id: "2", label: "Alan Turing", description: "alan@example.com" },
  { id: "3", label: "Grace Hopper", description: "grace@example.com" },
  { id: "4", label: "Katherine Johnson", description: "katherine@example.com" },
  { id: "5", label: "Margaret Hamilton", description: "margaret@example.com" },
];

const SEARCH_DELAY_MS = 200;

function delay(ms: number, signal: AbortSignal): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  if (signal.aborted) {
    reject(new DOMException("Aborted", "AbortError"));
    return promise;
  }
  const timer = setTimeout(resolve, ms);
  signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    },
    { once: true },
  );
  return promise;
}

/**
 * In-memory mock mention provider for the playground: filters a small
 * directory after a simulated network delay. Real deployments would fetch
 * from a user-search endpoint instead — `Mention`'s `items` option makes no
 * distinction between the two, both return (or reject) a `Promise`.
 */
export async function mockMentionProvider(
  query: string,
  signal: AbortSignal,
): Promise<MentionItem[]> {
  await delay(SEARCH_DELAY_MS, signal);

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return DIRECTORY;
  }
  return DIRECTORY.filter((item) => item.label.toLowerCase().includes(normalized));
}
