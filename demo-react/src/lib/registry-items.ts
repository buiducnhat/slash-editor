/**
 * Docs-facing copy of the catalog authored in `registry.json` (the source
 * `shadcn build` reads). Kept separate from that build manifest: this list
 * drives page copy/ordering, `registry.json` drives file/dependency wiring —
 * conflating them would make the docs page's shape hostage to the registry
 * schema's shape.
 */
export interface RegistryItemMeta {
  slug: string;
  title: string;
  description: string;
}

export const REGISTRY_NAMESPACE = "@slash-editor";

function registryOrigin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * `components.json` snippet a consumer adds once. Required, not optional: several items
 * (and the `slash-editor-kit` umbrella block) cross-reference this repo's own anchor-aware
 * `popover`/`dropdown-menu` via `@slash-editor/<name>` — a bare `shadcn add <raw-url>` install
 * has no registry context to resolve those against, and 404s. The namespace is the only
 * install path that works for every item in this registry.
 */
export function registryConfigSnippet(): string {
  return JSON.stringify(
    { registries: { [REGISTRY_NAMESPACE]: `${registryOrigin()}/r/{name}.json` } },
    null,
    2,
  );
}

export function addCommand(slug: string): string {
  return `bunx --bun shadcn@latest add ${REGISTRY_NAMESPACE}/${slug}`;
}

export const REGISTRY_ITEMS: RegistryItemMeta[] = [
  {
    slug: "slash-menu",
    title: "Slash Menu",
    description: "The '/' block-insert command palette: shadcn Command in an anchored Popover.",
  },
  {
    slug: "bubble-toolbar",
    title: "Bubble Toolbar",
    description: "Selection-anchored inline formatting: bold, italic, strike, code.",
  },
  {
    slug: "block-handle",
    title: "Block Handle",
    description: "Gutter hover handle for insert-below, drag-to-reorder, and the block menu.",
  },
  {
    slug: "mention-menu",
    title: "Mention Menu",
    description: "Async '@'-mention search surface with a loading state.",
  },
  {
    slug: "link-editor-popover",
    title: "Link Editor Popover",
    description: "Inline link create/edit popover: href input, open, and remove.",
  },
  {
    slug: "comment-panel",
    title: "Comment Panel",
    description: "Sidebar comment threads anchored to a selection, backed by a thread store.",
  },
  {
    slug: "presence-avatars",
    title: "Presence Avatars",
    description: "Connected collaborators as a row of colored initials.",
  },
  {
    slug: "node-views",
    title: "Media & AI Node Views",
    description: "Upload/retry chrome for image, file, video, an embed URL card, and an AI block.",
  },
];

export const KIT_SLUG = "slash-editor-kit";
