import type { UploadAdapter, UploadContext, UploadResult } from "@slash-editor/core";

/**
 * In-memory mock `UploadAdapter` for the playground: turns a `File` into a
 * data URL after a simulated network delay. Files named with a `fail-`
 * prefix reject once — so the retry affordance has something to click —
 * then succeed on the next attempt for that same name.
 */
const UPLOAD_DELAY_MS = 500;
const failedOnce = new Set<string>();

function readAsDataUrl(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
  reader.readAsDataURL(file);
  return promise;
}

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

export const mockUploadAdapter: UploadAdapter = {
  async upload(file: File, { signal }: UploadContext): Promise<UploadResult> {
    await delay(UPLOAD_DELAY_MS, signal);

    if (file.name.startsWith("fail-") && !failedOnce.has(file.name)) {
      failedOnce.add(file.name);
      throw new Error(`Mock upload failed for "${file.name}"`);
    }

    return { url: await readAsDataUrl(file) };
  },
};
