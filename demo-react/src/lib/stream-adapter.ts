import type { AiRequest, StreamAdapter, StreamContext } from "@slash-editor/core";

/** Canned responses per action id, so each default AI slash action reads distinctly in the demo. */
const RESPONSES: Record<string, string> = {
  "continue-writing":
    "the block editor keeps its schema flat and lets container nodes carry nesting instead of a universal wrapper. ",
  summarize: "The document describes a headless, Notion-style block editor built on Tiptap. ",
  "brainstorm-ideas":
    "- Slash actions for translation\n- A comment thread adapter\n- Emoji autocomplete\n",
  "fix-spelling-grammar": "This sentence has been rewritten with corrected spelling and grammar. ",
};

/** A context containing this marker makes the mock reject mid-stream, once, for the retry affordance. */
const FAILURE_MARKER = "trigger-ai-error";
const failedOnce = new Set<string>();

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

async function* words(request: AiRequest, { signal }: StreamContext): AsyncGenerator<string> {
  const text = RESPONSES[request.action] ?? `Mock response for "${request.prompt}"\n`;
  const shouldFail = request.context.includes(FAILURE_MARKER) && !failedOnce.has(request.action);
  const chunks = text.split(/(?<=\s)/);

  for (const [index, chunk] of chunks.entries()) {
    await delay(60, signal);

    if (shouldFail && index === Math.floor(chunks.length / 2)) {
      failedOnce.add(request.action);
      throw new Error("Mock AI stream failed");
    }

    yield chunk;
  }
}

/**
 * In-memory mock `StreamAdapter` for the playground: yields a canned
 * response word by word after a simulated per-token delay. A context
 * containing `"trigger-ai-error"` fails once mid-stream — so the retry
 * affordance (and a future e2e spec) has a real error to recover from,
 * mirroring `mockUploadAdapter`'s `fail-`-prefixed file names.
 */
export const mockStreamAdapter: StreamAdapter = {
  stream: words,
};
