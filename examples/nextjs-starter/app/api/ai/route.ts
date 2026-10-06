import type { AiRequest } from "@slash-editor/core";

export const runtime = "nodejs";

/** Canned responses per action id, so each built-in AI action reads distinctly. */
const RESPONSES: Record<string, string> = {
  "continue-writing":
    "the block editor keeps its schema flat and lets container nodes carry nesting instead of a universal wrapper. Every surface you see is a component you own, so changing how it looks never means forking the library. ",
  summarize:
    "The document introduces a headless, Notion-style block editor built on Tiptap, with the interface shipped as editable source code. ",
  "brainstorm-ideas":
    "- Slash actions that translate the selection\n- A comment thread store backed by your database\n- A page tree synced over Hocuspocus\n- Emoji reactions on blocks\n",
  "improve-writing":
    "This text now reads more clearly: shorter sentences, active voice, and one idea per paragraph. ",
  "fix-spelling-grammar": "This sentence has been rewritten with corrected spelling and grammar. ",
  "make-shorter": "A shorter version of the selected text. ",
  "make-longer":
    "A longer version of the selected text, expanded with supporting detail, a concrete example, and a closing thought that ties the idea back to the reader's goal. ",
};

/**
 * A selection or block whose text contains this marker fails once, to exercise
 * the retry UI. Cursor requests send the whole preceding document, so they are
 * exempt: the marker would otherwise break the first action on any page that
 * shows it.
 */
const FAILURE_MARKER = "trigger-ai-error";
const failedOnce = new Set<string>();

const encoder = new TextEncoder();
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAiRequest(value: unknown): value is AiRequest {
  if (typeof value !== "object" || value === null) return false;

  const { action, prompt, context } = value as Record<string, unknown>;

  return typeof action === "string" && typeof prompt === "string" && typeof context === "string";
}

/**
 * Yields the model's answer piece by piece. This is the one function to
 * replace with a real provider (OpenAI, Anthropic, Vercel AI SDK, ...): map
 * `request.action`, `request.prompt`, and `request.context` to your prompt and
 * yield each text delta you receive.
 */
async function* generate(request: AiRequest, signal: AbortSignal): AsyncGenerator<string> {
  const text = RESPONSES[request.action] ?? `Mock response for "${request.prompt}"\n`;
  const chunks = text.split(/(?<=\s)/);

  for (const chunk of chunks) {
    if (signal.aborted) return;
    await sleep(45);
    yield chunk;
  }
}

/** `POST /api/ai` with an `AiRequest` body → a plain-text stream of the answer. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (!isAiRequest(body)) {
    return Response.json({ error: "Expected { action, prompt, context }" }, { status: 400 });
  }

  if (
    body.scope !== "cursor" &&
    body.context.includes(FAILURE_MARKER) &&
    !failedOnce.has(body.action)
  ) {
    failedOnce.add(body.action);
    return Response.json({ error: "Mock AI request failed. Try again." }, { status: 503 });
  }

  const iterator = generate(body, request.signal);
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();

        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
    cancel: () => void iterator.return(undefined),
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
