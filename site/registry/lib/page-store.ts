import { collectPageRefs, type PageMeta, type PageRefs, type PageStore } from "@slash-editor/core";
import type { JSONContent } from "@tiptap/core";

/** What the demo persists: page metadata, document bodies, and the backlinks index. */
interface Snapshot {
  pages: Record<string, PageMeta>;
  content: Record<string, JSONContent>;
  refs: Record<string, PageRefs>;
}

export interface DemoPageStore extends PageStore {
  /** Document body for `pageId`, or `undefined` for a page never edited. */
  getContent(pageId: string): JSONContent | undefined;
  /** Stores a body and re-indexes the pages it references, the way a host would on save. */
  setContent(pageId: string, content: JSONContent): void;
  /** Moves pages to (or out of) the trash; unknown ids are ignored. */
  setTrashed(pageIds: readonly string[], trashed: boolean): void;
}

const STORAGE_KEY = "slash-editor:pages:v1";
export const DEMO_ROOT_PAGE_ID = "home";

const text = (value: string): JSONContent => ({ type: "text", text: value });
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });

function seed(): Snapshot {
  const home: PageMeta = { id: DEMO_ROOT_PAGE_ID, parentId: null, title: "Home", icon: "🏠" };
  const guide: PageMeta = { id: "guide", parentId: home.id, title: "Getting started", icon: "📘" };
  const content: Record<string, JSONContent> = {
    [home.id]: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [text("Welcome")] },
        paragraph(text("Type / and pick Page to nest a page, or @ to link to one.")),
        { type: "subPage", attrs: { pageId: guide.id } },
        paragraph(),
      ],
    },
    [guide.id]: {
      type: "doc",
      content: [
        paragraph(text("A sub-page. Its title lives in the page store, not in this document.")),
        paragraph(),
      ],
    },
  };

  return {
    pages: { [home.id]: home, [guide.id]: guide },
    content,
    refs: Object.fromEntries(
      Object.entries(content).map(([id, doc]) => [id, collectPageRefs(doc)]),
    ),
  };
}

function load(storage: Storage | undefined): Snapshot {
  try {
    const raw = storage?.getItem(STORAGE_KEY);

    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {
    // Unreadable or blocked storage: start from the seed rather than fail the demo.
  }

  return seed();
}

/**
 * In-memory page directory for the playground, persisted to `localStorage`.
 * It is the reference for what a host implements: `peek` hands back the same
 * object until a page changes, every mutation notifies subscribers, and the
 * backlinks index is fed from `collectPageRefs` whenever a body is saved. A
 * real host swaps the `Map`-style bookkeeping for its API and cache.
 */
export function createDemoPageStore(
  storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage,
): DemoPageStore {
  const snapshot = load(storage);
  const listeners = new Set<() => void>();

  const commit = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
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
  const all = () => Object.values(snapshot.pages);

  return {
    create: ({ parentId, title }) => {
      const page: PageMeta = { id: crypto.randomUUID().slice(0, 8), parentId, title: title ?? "" };

      snapshot.pages[page.id] = page;
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
  };
}
