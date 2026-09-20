import { mergeAttributes, Node } from "@tiptap/core";
import {
  PendingUploadRegistry,
  retryUpload,
  runUpload,
  type UploadAdapter,
  type UploadStatus,
} from "./upload.ts";

export interface ImageOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface ImageStorage {
  pending: PendingUploadRegistry;
}

/** Inserted with a picked file: uploads through `adapter`, no `src` until it resolves. */
export interface SetImageFromFile {
  file: File;
  adapter: UploadAdapter;
  alt?: string;
}

/** Inserted directly from a known URL: skips the upload adapter entirely. */
export interface SetImageFromSrc {
  src: string;
  alt?: string;
  width?: number | null;
}

export type SetImageOptions = SetImageFromFile | SetImageFromSrc;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      /** Inserts an image node. Omit the options to insert an empty placeholder. */
      setImage: (options?: SetImageOptions) => ReturnType;
      /**
       * Re-sends the last `File` for the node with this id, or `override`
       * to attach a file to a node that has never had an upload attempt
       * (e.g. an empty placeholder).
       */
      retryImage: (id: string, override?: { file: File; adapter: UploadAdapter }) => ReturnType;
    };
  }
}

function initialAttrs(id: string, options?: SetImageOptions) {
  if (options && "file" in options) {
    return {
      id,
      src: null,
      alt: options.alt ?? null,
      width: null,
      status: "uploading" as UploadStatus,
      error: null,
    };
  }
  return {
    id,
    src: options?.src ?? null,
    alt: options?.alt ?? null,
    width: options?.width ?? null,
    status: "ready" as UploadStatus,
    error: null,
  };
}

/**
 * A block-level image, optionally backed by an in-flight `UploadAdapter`
 * upload. `status`/`error` live in node attrs (part of the doc) so a
 * completed or failed upload re-renders through the normal transaction
 * pipeline — no separate subscribe/storage channel like the slash menu or
 * bubble toolbar, which track ephemeral UI state instead of document state.
 *
 * The picked `File` itself never touches attrs (not JSON-serializable, not
 * Yjs-safe); it lives in `storage.pending`, keyed by the node's `BlockId`,
 * so `retryImage` can resend it without the user picking again.
 */
export const Image = Node.create<ImageOptions, ImageStorage>({
  name: "image",
  group: "block",
  atom: true,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addStorage() {
    return { pending: new PendingUploadRegistry() };
  },
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("width");
          return value ? Number(value) : null;
        },
      },
      status: {
        default: "ready",
        parseHTML: (element) => element.getAttribute("data-status") ?? "ready",
        renderHTML: (attributes) => ({ "data-status": attributes.status }),
      },
      error: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-error"),
        renderHTML: (attributes) => (attributes.error ? { "data-error": attributes.error } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
    ];
  },
  addCommands() {
    return {
      setImage:
        (options?: SetImageOptions) =>
        ({ commands, dispatch }) => {
          const id = crypto.randomUUID();
          const inserted = commands.insertContent({
            type: this.name,
            attrs: initialAttrs(id, options),
          });
          if (inserted && dispatch && options && "file" in options) {
            const { file, adapter } = options;
            queueMicrotask(() => {
              runUpload({
                editor: this.editor,
                typeName: this.name,
                id,
                file,
                adapter,
                pending: this.storage.pending,
                toAttrs: (result) => ({ src: result.url }),
              });
            });
          }
          return inserted;
        },
      retryImage:
        (id: string, override?: { file: File; adapter: UploadAdapter }) =>
        ({ dispatch }) => {
          const hasEntry = override !== undefined || this.storage.pending.get(id) !== undefined;
          if (!dispatch || !hasEntry) {
            return hasEntry;
          }
          // Deferred: `retryUpload` dispatches its own transaction, which
          // would collide with the transaction Tiptap's command pipeline is
          // still assembling for this very call if done synchronously here.
          queueMicrotask(() => {
            retryUpload({
              editor: this.editor,
              typeName: this.name,
              id,
              pending: this.storage.pending,
              toAttrs: (result) => ({ src: result.url }),
              override,
            });
          });
          return true;
        },
    };
  },
});

/** Configures the image node. */
export function image(options: Partial<ImageOptions> = {}) {
  return Image.configure(options);
}
