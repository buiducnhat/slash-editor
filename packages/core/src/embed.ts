import { mergeAttributes, Node } from "@tiptap/core";

export interface EmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type EmbedMode = "bookmark" | "iframe";

export interface SetEmbedOptions {
  /** Omit to insert an empty placeholder a `NodeView` can fill in later. */
  url?: string;
  /** @default "bookmark" */
  mode?: EmbedMode;
  title?: string;
  description?: string;
  thumbnail?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      /** Inserts a bookmark or iframe embed node. */
      setEmbed: (options?: SetEmbedOptions) => ReturnType;
    };
  }
}

function optionalAttrs(node: { attrs: Record<string, unknown> }): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (node.attrs.title) attrs["data-title"] = node.attrs.title as string;
  if (node.attrs.description) attrs["data-description"] = node.attrs.description as string;
  if (node.attrs.thumbnail) attrs["data-thumbnail"] = node.attrs.thumbnail as string;
  return attrs;
}

/**
 * A block-level external embed: a bookmark link card or a sandboxed
 * iframe, chosen by `mode`. No upload adapter — the URL (and, for
 * bookmarks, the optional title/description/thumbnail metadata) is set
 * directly, either at insert time or later by a `NodeView` reading a
 * pasted link.
 */
export const Embed = Node.create<EmbedOptions>({
  name: "embed",
  group: "block",
  atom: true,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      url: { default: null },
      mode: { default: "bookmark" satisfies EmbedMode },
      title: { default: null },
      description: { default: null },
      thumbnail: { default: null },
    };
  },
  parseHTML() {
    return [
      {
        tag: `iframe[data-type="${this.name}"]`,
        getAttrs: (element) => ({
          url: element.getAttribute("src"),
          mode: "iframe",
          title: element.getAttribute("data-title"),
          description: element.getAttribute("data-description"),
          thumbnail: element.getAttribute("data-thumbnail"),
        }),
      },
      {
        tag: `a[data-type="${this.name}"]`,
        getAttrs: (element) => ({
          url: element.getAttribute("href"),
          mode: "bookmark",
          title: element.getAttribute("data-title"),
          description: element.getAttribute("data-description"),
          thumbnail: element.getAttribute("data-thumbnail"),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    const shared = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      "data-type": this.name,
      "data-mode": node.attrs.mode,
      ...optionalAttrs(node),
    });
    if (node.attrs.mode === "iframe") {
      return [
        "iframe",
        mergeAttributes(shared, {
          ...(node.attrs.url ? { src: node.attrs.url } : {}),
          loading: "lazy",
          referrerpolicy: "no-referrer",
          sandbox: "allow-scripts allow-same-origin allow-popups",
        }),
      ];
    }
    return [
      "a",
      mergeAttributes(shared, {
        ...(node.attrs.url ? { href: node.attrs.url } : {}),
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      (node.attrs.title as string | null) ?? (node.attrs.url as string | null) ?? "Untitled link",
    ];
  },
  addCommands() {
    return {
      setEmbed:
        (options: SetEmbedOptions = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              id: crypto.randomUUID(),
              url: options.url ?? null,
              mode: options.mode ?? "bookmark",
              title: options.title ?? null,
              description: options.description ?? null,
              thumbnail: options.thumbnail ?? null,
            },
          }),
    };
  },
});

/** Configures the embed node. */
export function embed(options: Partial<EmbedOptions> = {}) {
  return Embed.configure(options);
}
