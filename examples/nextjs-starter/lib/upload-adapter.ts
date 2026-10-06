import type { UploadAdapter } from "@slash-editor/core";

/**
 * `UploadAdapter` for the image, file, and video nodes: POSTs the file to
 * `/api/upload` and returns the URL the server hands back. The editor aborts
 * `signal` when the node is deleted mid-upload.
 */
export const uploadAdapter: UploadAdapter = {
  async upload(file, { signal }) {
    const body = new FormData();
    body.set("file", file);

    const response = await fetch("/api/upload", { method: "POST", body, signal });

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: undefined }));
      throw new Error(error ?? `Upload failed (${response.status})`);
    }

    return response.json();
  },
};
