import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/** Lifecycle of a media node backed by an {@link UploadAdapter}. */
export type UploadStatus = "uploading" | "ready" | "error";

export interface UploadContext {
  /** Aborted when the node carrying this upload is deleted before it settles. */
  signal: AbortSignal;
}

export interface UploadResult {
  url: string;
}

/**
 * Bring-your-own upload backend. Nodes never talk to a network directly —
 * every image/file/video command takes an adapter instance explicitly, so
 * core stays backend-agnostic and the demo can swap in a mock for tests.
 */
export interface UploadAdapter<TResult extends UploadResult = UploadResult> {
  upload(file: File, context: UploadContext): Promise<TResult>;
}

export interface BlockLocation {
  pos: number;
  node: ProseMirrorNode;
}

/**
 * Finds a node by its `BlockId`-assigned `id` attribute. Pure: takes a doc,
 * not an editor, so it is testable without a live view.
 */
export function findNodeById(doc: ProseMirrorNode, id: string): BlockLocation | null {
  let found: BlockLocation | null = null;
  doc.descendants((node, pos) => {
    if (found) {
      return false;
    }
    if (node.attrs.id === id) {
      found = { pos, node };
      return false;
    }
    return true;
  });
  return found;
}

interface PendingEntry {
  file: File;
  adapter: UploadAdapter;
  controller: AbortController;
}

/**
 * Per-node-type registry of in-flight/failed uploads, keyed by the node's
 * `id`. Retrying re-sends the same `File` without asking the user to pick it
 * again; entries are dropped on success, kept on failure and on abort.
 *
 * Files are never stored in node attrs: attrs must stay JSON-serializable
 * for Yjs (M4), so the pending `File` lives here instead.
 */
export class PendingUploadRegistry {
  private readonly pending = new Map<string, PendingEntry>();

  set(id: string, entry: PendingEntry): void {
    this.pending.get(id)?.controller.abort();
    this.pending.set(id, entry);
  }

  get(id: string): PendingEntry | undefined {
    return this.pending.get(id);
  }

  delete(id: string): void {
    this.pending.delete(id);
  }
}

function applyAttrs(
  editor: Editor,
  typeName: string,
  id: string,
  patch: Record<string, unknown>,
): void {
  const location = findNodeById(editor.state.doc, id);
  if (!location || location.node.type.name !== typeName) {
    return;
  }
  const tr = editor.state.tr
    .setNodeMarkup(location.pos, undefined, { ...location.node.attrs, ...patch })
    .setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

export interface RunUploadOptions<TResult extends UploadResult> {
  editor: Editor;
  typeName: string;
  id: string;
  file: File;
  adapter: UploadAdapter<TResult>;
  pending: PendingUploadRegistry;
  /** Maps a successful result onto the node-specific attrs to persist (e.g. `{ src: result.url }`). */
  toAttrs: (result: TResult) => Record<string, unknown>;
}

/**
 * Starts (or restarts) an upload for a node already present in the
 * document. Resolves by locating the node through `id` — not a captured
 * position — since the doc may change while the network request is in
 * flight. Completion never creates a separate undo step.
 */
export function runUpload<TResult extends UploadResult>(options: RunUploadOptions<TResult>): void {
  const { editor, typeName, id, file, adapter, pending, toAttrs } = options;
  const controller = new AbortController();
  pending.set(id, { file, adapter, controller });

  adapter
    .upload(file, { signal: controller.signal })
    .then((result) => {
      if (controller.signal.aborted) {
        return;
      }
      pending.delete(id);
      applyAttrs(editor, typeName, id, { status: "ready", error: null, ...toAttrs(result) });
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return;
      }
      applyAttrs(editor, typeName, id, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    });
}

export interface RetryUploadOptions<TResult extends UploadResult> {
  editor: Editor;
  typeName: string;
  id: string;
  pending: PendingUploadRegistry;
  toAttrs: (result: TResult) => Record<string, unknown>;
  /**
   * Starts from this file/adapter instead of the last one recorded in
   * `pending` — the same machinery also covers "attach a file to an empty
   * placeholder node" (nothing has been attempted yet, so there is no
   * pending entry to fall back on).
   */
  override?: { file: File; adapter: UploadAdapter<TResult> };
}

/**
 * (Re)starts an upload for a node already in the document: from the last
 * `File` passed to `runUpload` for this id, or from `override` when the
 * node has never had an upload attempt (e.g. a placeholder that just had a
 * file attached). Returns `false` — a no-op — when neither is available.
 */
export function retryUpload<TResult extends UploadResult>(
  options: RetryUploadOptions<TResult>,
): boolean {
  const { editor, typeName, id, pending, toAttrs, override } = options;
  const entry = override ?? pending.get(id);
  if (!entry) {
    return false;
  }
  applyAttrs(editor, typeName, id, { status: "uploading", error: null });
  runUpload({
    editor,
    typeName,
    id,
    file: entry.file,
    adapter: entry.adapter as UploadAdapter<TResult>,
    pending,
    toAttrs,
  });
  return true;
}
