/** Every demo page, in the order the header and the home page list them. */
export interface Demo {
  href: string;
  title: string;
  /** Label in the header nav, where space is tight. */
  short: string;
  description: string;
  /** Lucide icon name; resolved by `DemoIcon` so this module stays free of React. */
  icon: "layout" | "pages" | "users" | "sparkles" | "markdown" | "languages" | "upload" | "eye" | "puzzle";
  /** Features the page shows off, rendered as chips on the home page. */
  tags: string[];
}

export const DEMOS: Demo[] = [
  {
    href: "/editor",
    short: "Editor",
    title: "Full editor",
    description:
      "Every block and surface in one document: slash menu, drag handle, bubble toolbar, mentions, emoji, comments and a table of contents. Autosaves to your browser.",
    icon: "layout",
    tags: ["Slash menu", "Autosave", "Comments", "Mentions"],
  },
  {
    href: "/notes",
    short: "Notes",
    title: "Notes workspace",
    description:
      "A Notion-style page tree: sub-pages, page links, breadcrumbs, icons, covers and backlinks over a localStorage page store.",
    icon: "pages",
    tags: ["Sub-pages", "Page links", "Backlinks"],
  },
  {
    href: "/collab",
    short: "Collab",
    title: "Real-time collaboration",
    description:
      "Yjs with live cursors and presence avatars. Open the same room in two tabs and watch them converge.",
    icon: "users",
    tags: ["Yjs", "Presence", "Carets"],
  },
  {
    href: "/ai",
    short: "AI",
    title: "AI writing",
    description:
      "Slash, selection and block-level AI actions streaming from a Next.js route handler you can point at any model.",
    icon: "sparkles",
    tags: ["Streaming", "Route handler", "Retry"],
  },
  {
    href: "/markdown",
    short: "Markdown",
    title: "Markdown",
    description:
      "Two-way markdown: edit the source and the document follows, or import and download .md files.",
    icon: "markdown",
    tags: ["Import", "Export", "Live sync"],
  },
  {
    href: "/media",
    short: "Media",
    title: "Media uploads",
    description:
      "Images, files, video and embeds uploaded through a route handler, with progress, retry and drag-and-drop.",
    icon: "upload",
    tags: ["Upload adapter", "Retry", "Drag & drop"],
  },
  {
    href: "/i18n",
    short: "i18n",
    title: "Localization",
    description:
      "Translate the slash menu, toolbar, block menu and placeholders with the messages option. Switch languages live.",
    icon: "languages",
    tags: ["English", "Tiếng Việt", "Français", "日本語"],
  },
  {
    href: "/read-only",
    short: "Read-only",
    title: "Read-only article",
    description:
      "Render saved content as a published page: no editing chrome, a table of contents and working links.",
    icon: "eye",
    tags: ["setEditable", "Table of contents"],
  },
  {
    href: "/custom",
    short: "Custom",
    title: "Custom blocks",
    description:
      "Extend the kit with your own Tiptap node, React node view, slash item and toolbar action.",
    icon: "puzzle",
    tags: ["Custom node", "Slash item", "Node view"],
  },
];
