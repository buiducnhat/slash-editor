import type { StreamAdapter } from "@slash-editor/core";

/**
 * `blockKit.ai.adapter`: POSTs the request to `/api/ai` and yields the
 * response body as it arrives. The editor aborts `signal` when the user stops
 * or deletes the AI block, which cancels the fetch and the server stream.
 */
export const streamAdapter: StreamAdapter = {
  async *stream(request, { signal }) {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok || !response.body) {
      const { error } = await response.json().catch(() => ({ error: undefined }));
      throw new Error(error ?? `AI request failed (${response.status})`);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    try {
      for (;;) {
        const { value, done } = await reader.read();

        if (done) return;
        yield value;
      }
    } finally {
      void reader.cancel().catch(() => {});
    }
  },
};
