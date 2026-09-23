import { mergeAttributes, Node } from "@tiptap/core";
import { mediaMarkdown } from "./markdown-syntax.ts";
import {
  PendingUploadRegistry,
  retryUpload,
  runUpload,
  type UploadAdapter,
  type UploadStatus,
} from "./upload.ts";

export interface FileOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface FileStorage {
  pending: PendingUploadRegistry;
}

/** Inserted with a picked file: uploads through `adapter`; name/size/mime read from the `File` immediately. */
export interface SetFileFromFile {
  file: File;
  adapter: UploadAdapter;
}

/** Inserted directly from a known URL. */
export interface SetFileFromSrc {
  src: string;
  name?: string;
  size?: number | null;
  mime?: string | null;
}

export type SetFileOptions = SetFileFromFile | SetFileFromSrc;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    file: {
      /** Inserts a file node. Omit the options to insert an empty placeholder. */
      setFile: (options?: SetFileOptions) => ReturnType;
      /**
       * Re-sends the last `File` for the node with this id, or `override`
       * to attach a file to a node that has never had an upload attempt
       * (e.g. an empty placeholder).
       */
      retryFile: (id: string, override?: { file: File; adapter: UploadAdapter }) => ReturnType;
    };
  }
}

function initialAttrs(id: string, options?: SetFileOptions) {
  if (options && "file" in options) {
    const { file } = options;
    return {
      id,
      src: null,
      name: file.name,
      size: file.size,
      mime: file.type || null,
      status: "uploading" as UploadStatus,
      error: null,
    };
  }
  return {
    id,
    src: options?.src ?? null,
    name: options?.name ?? null,
    size: options?.size ?? null,
    mime: options?.mime ?? null,
    status: "ready" as UploadStatus,
    error: null,
  };
}

/**
 * A block-level generic-file attachment. Same upload/retry shape as
 * `Image`: `status`/`error` live in doc attrs, the picked `File` lives in
 * `storage.pending` keyed by `id`. See `image.ts` for the full rationale.
 */
export const File = Node.create<FileOptions, FileStorage>({
  name: "file",
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
      name: { default: null },
      size: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-size");
          return value ? Number(value) : null;
        },
        renderHTML: (attributes) =>
          attributes.size != null ? { "data-size": String(attributes.size) } : {},
      },
      mime: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mime"),
        renderHTML: (attributes) => (attributes.mime ? { "data-mime": attributes.mime } : {}),
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
    return [{ tag: `div[data-type="${this.name}"]` }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      [
        "a",
        {
          href: node.attrs.src ?? undefined,
          download: node.attrs.name ?? undefined,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        node.attrs.name ?? "Untitled file",
      ],
    ];
  },
  ...mediaMarkdown({
    type: "file",
    hrefAttr: "src",
    labelAttr: "name",
    markerKeys: ["size", "mime"],
  }),
  addCommands() {
    return {
      setFile:
        (options?: SetFileOptions) =>
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
      retryFile:
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

/** Configures the file node. */
export function file(options: Partial<FileOptions> = {}) {
  return File.configure(options);
}
