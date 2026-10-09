import { collectPageRefs, type PageMeta, type PageRefs, type PageStore } from "@slash-editor/core";
import type { JSONContent } from "@tiptap/core";

/** What the demo persists: page metadata, document bodies, and the backlinks index. */
interface Snapshot {
  pages: Record<string, PageMeta>;
  /** Every page id in sibling order: a page's siblings are the ids sharing its `parentId`, in this order. */
  order: string[];
  content: Record<string, JSONContent>;
  refs: Record<string, PageRefs>;
}

export interface DemoPageStore extends PageStore {
  /** Document body for `pageId`, or `undefined` for a page never edited. */
  getContent(pageId: string): JSONContent | undefined;
  /** Stores a body and re-indexes the pages it references, the way a host would on save. */
  setContent(pageId: string, content: JSONContent): void;
  setTrashed(pageIds: readonly string[], trashed: boolean): void;
  move(id: string, target: { parentId: string | null; index: number }): void;
}

export const PAGES_STORAGE_KEY = "slash-editor-starter:notes:pages";
export const DEMO_ROOT_PAGE_ID = "home";

const text = (value: string): JSONContent => ({ type: "text", text: value });
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const heading = (value: string, level = 1): JSONContent => ({
  type: "heading",
  attrs: { level },
  content: [text(value)],
});
const subPage = (pageId: string): JSONContent => ({ type: "subPage", attrs: { pageId } });
const pageLink = (pageId: string): JSONContent => ({ type: "pageLink", attrs: { pageId } });
const bullet = (...content: JSONContent[]): JSONContent => ({
  type: "listItem",
  content: [paragraph(...content)],
});
const bulletList = (...items: JSONContent[]): JSONContent => ({ type: "bulletList", content: items });

/** A small workspace that exercises every page feature: nesting, inline links, backlinks, icons. */
function seed(): Snapshot {
  const home: PageMeta = { id: DEMO_ROOT_PAGE_ID, parentId: null, title: "Home", icon: "🏠" };
  const guide: PageMeta = { id: "guide", parentId: home.id, title: "Getting started", icon: "📘" };
  const ideas: PageMeta = { id: "ideas", parentId: home.id, title: "Ideas", icon: "💡" };
  const roadmap: PageMeta = { id: "roadmap", parentId: guide.id, title: "Roadmap", icon: "🗺️" };
  const content: Record<string, JSONContent> = {
    [home.id]: {
      type: "doc",
      content: [
        paragraph(
          text(
            "This workspace is a Notion-style page tree built on the pages feature. Everything is stored in your browser's localStorage, so edits survive a reload.",
          ),
        ),
        heading("Try it out", 2),
        bulletList(
          bullet(text("Type / and pick Page to nest a new sub-page inside this one.")),
          bullet(text("Type @ to link to any page, like "), pageLink(guide.id), text(".")),
          bullet(text("Type : and a name to drop an emoji, e.g. :tada: 🎉")),
          bullet(text("Click the icon or title above to rename a page or add a cover.")),
          bullet(text("Delete a sub-page block to move it to the trash; undo brings it back.")),
        ),
        heading("Sub-pages", 2),
        subPage(guide.id),
        subPage(ideas.id),
        paragraph(),
      ],
    },
    [guide.id]: {
      type: "doc",
      content: [
        paragraph(
          text("A sub-page. Its title and icon live in the page store, not in this document. Back to "),
          pageLink(home.id),
          text(" — check the backlinks panel below."),
        ),
        subPage(roadmap.id),
        paragraph(),
      ],
    },
    [ideas.id]: {
      type: "doc",
      content: [
        paragraph(text("Jot down anything here. Pages can nest as deep as you like. 🚀")),
        paragraph(),
      ],
    },
    [roadmap.id]: {
      type: "doc",
      content: [
        paragraph(text("Sub-pages of sub-pages show up in the sidebar tree and the breadcrumb.")),
        paragraph(),
      ],
    },
  };

  return {
    pages: Object.fromEntries([home, guide, ideas, roadmap].map((page) => [page.id, page])),
    order: [home.id, guide.id, ideas.id, roadmap.id],
    content,
    refs: Object.fromEntries(
      Object.entries(content).map(([id, doc]) => [id, collectPageRefs(doc)]),
    ),
  };
}

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

/** Stored data is untrusted: a hand-edited or older entry must fall back to the seed, not crash. */
function isSnapshot(value: unknown): value is Snapshot {
  if (!isObject(value)) return false;

  const { pages, order, content, refs } = value as Partial<Record<keyof Snapshot, unknown>>;

  return (
    isObject(pages) &&
    Object.values(pages).every(
      (page: Partial<PageMeta> | null) =>
        typeof page?.id === "string" && typeof page.title === "string",
    ) &&
    (order === undefined || (Array.isArray(order) && order.every((id) => typeof id === "string"))) &&
    isObject(content) &&
    isObject(refs) &&
    Object.values(refs).every(
      (entry: Partial<PageRefs> | null) =>
        Array.isArray(entry?.links) && Array.isArray(entry.subPages),
    )
  );
}

function load(storage: Storage | undefined): Snapshot {
  try {
    const raw = storage?.getItem(PAGES_STORAGE_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (isSnapshot(parsed)) {
        // Snapshots saved before ordering existed have no `order`; ids it lacks or no longer has are repaired.
        const known = (parsed.order ?? []).filter((id) => id in parsed.pages);

        return { ...parsed, order: [...new Set([...known, ...Object.keys(parsed.pages)])] };
      }
    }
  } catch {
    // Unreadable or blocked storage: start from the seed rather than fail the demo.
  }

  return seed();
}

/** `localStorage` itself throws when the browser denies storage, so even reading the property is guarded. */
function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/**
 * In-memory page directory for the playground, persisted to `localStorage`.
 * It is the reference for what a host implements: `peek` hands back the same
 * object until a page changes, every mutation notifies subscribers, and the
 * backlinks index is fed from `collectPageRefs` whenever a body is saved. A
 * real host swaps the `Map`-style bookkeeping for its API and cache.
 */
export function createDemoPageStore(
  storage: Storage | undefined = browserStorage(),
): DemoPageStore {
  let snapshot = load(storage);
  const listeners = new Set<() => void>();

  // Every commit writes the whole snapshot, so a tab that kept an old copy would erase
  // pages another tab created. Adopting the other tab's write keeps them converged.
  if (storage && typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.storageArea === storage && event.key === PAGES_STORAGE_KEY) {
        snapshot = load(storage);
        listeners.forEach((listener) => listener());
      }
    });
  }

  const commit = () => {
    try {
      storage?.setItem(PAGES_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota or privacy mode: the session still works, it just won't persist.
    }
    listeners.forEach((listener) => listener());
  };
  const replace = (id: string, patch: Partial<PageMeta>) => {
    const current = snapshot.pages[id];

    if (current) {
      snapshot.pages[id] = { ...current, ...patch };
    }
  };
  const all = () => snapshot.order.flatMap((id) => snapshot.pages[id] ?? []);
  // True when `id` is `ancestorId` or sits below it; the `seen` guard survives a hand-edited cycle.
  const isInside = (id: string | null, ancestorId: string) => {
    const seen = new Set<string>();

    for (let at = id; at !== null && !seen.has(at); at = snapshot.pages[at]?.parentId ?? null) {
      if (at === ancestorId) return true;
      seen.add(at);
    }

    return false;
  };

  return {
    create: ({ parentId, title }) => {
      const page: PageMeta = { id: crypto.randomUUID().slice(0, 8), parentId, title: title ?? "" };

      snapshot.pages[page.id] = page;
      snapshot.order.push(page.id);
      commit();

      return page;
    },

    update: (id, patch) => {
      replace(id, patch);
      commit();
    },

    peek: (id) => snapshot.pages[id],
    load: async (id) => snapshot.pages[id],
    listChildren: async (parentId) => all().filter((page) => page.parentId === parentId),

    search: async (query) => {
      const normalized = query.trim().toLowerCase();

      return all().filter(
        (page) => !page.trashed && (page.title || "Untitled").toLowerCase().includes(normalized),
      );
    },

    backlinks: async (id) =>
      Object.entries(snapshot.refs)
        .filter(
          ([from, refs]) => from !== id && (refs.links.includes(id) || refs.subPages.includes(id)),
        )
        .map(([from]) => from),

    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },

    getContent: (pageId) => snapshot.content[pageId],

    setContent: (pageId, content) => {
      snapshot.content[pageId] = content;
      snapshot.refs[pageId] = collectPageRefs(content);
      commit();
    },

    setTrashed: (pageIds, trashed) => {
      pageIds.forEach((id) => replace(id, { trashed }));
      commit();
    },

    move: (id, { parentId, index }) => {
      if (!snapshot.pages[id]) return;
      if (parentId !== null && (!snapshot.pages[parentId] || isInside(parentId, id))) return;

      const rest = snapshot.order.filter((other) => other !== id);
      const siblings = rest.filter((other) => snapshot.pages[other]?.parentId === parentId);
      const before = siblings[Math.min(Math.max(index, 0), siblings.length)];

      rest.splice(before === undefined ? rest.length : rest.indexOf(before), 0, id);
      snapshot.order = rest;
      replace(id, { parentId });
      commit();
    },
  };
}
