import { mergeAttributes, Node } from "@tiptap/core";
import { mediaMarkdown } from "./markdown-syntax.ts";
import {
  PendingUploadRegistry,
  retryUpload,
  runUpload,
  type UploadAdapter,
  type UploadStatus,
} from "./upload.ts";

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface VideoStorage {
  pending: PendingUploadRegistry;
}

/** Inserted with a picked file: uploads through `adapter`, no `src` until it resolves. */
export interface SetVideoFromFile {
  file: File;
  adapter: UploadAdapter;
  poster?: string;
}

/** Inserted directly from a known URL. */
export interface SetVideoFromSrc {
  src: string;
  poster?: string;
}

export type SetVideoOptions = SetVideoFromFile | SetVideoFromSrc;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      /** Inserts a video node. Omit the options to insert an empty placeholder. */
      setVideo: (options?: SetVideoOptions) => ReturnType;
      /**
       * Re-sends the last `File` for the node with this id, or `override`
       * to attach a file to a node that has never had an upload attempt
       * (e.g. an empty placeholder).
       */
      retryVideo: (id: string, override?: { file: File; adapter: UploadAdapter }) => ReturnType;
    };
  }
}

function initialAttrs(id: string, options?: SetVideoOptions) {
  if (options && "file" in options) {
    return {
      id,
      src: null,
      poster: options.poster ?? null,
      status: "uploading" as UploadStatus,
      error: null,
    };
  }
  return {
    id,
    src: options?.src ?? null,
    poster: options?.poster ?? null,
    status: "ready" as UploadStatus,
    error: null,
  };
}

/**
 * A block-level video, same upload/retry shape as `Image`: `status`/`error`
 * live in doc attrs, the picked `File` lives in `storage.pending` keyed by
 * `id`. See `image.ts` for the full rationale.
 */
export const Video = Node.create<VideoOptions, VideoStorage>({
  name: "video",
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
      poster: { default: null },
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
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        controls: "",
      }),
    ];
  },
  ...mediaMarkdown({ type: "video", hrefAttr: "src", markerKeys: ["poster"] }),
  addCommands() {
    return {
      setVideo:
        (options?: SetVideoOptions) =>
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
      retryVideo:
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

/** Configures the video node. */
export function video(options: Partial<VideoOptions> = {}) {
  return Video.configure(options);
}
