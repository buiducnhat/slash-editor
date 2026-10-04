import type { PageMeta, PageStore } from "@slash-editor/core";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/*
 * These hooks read a `PageStore` directly and never touch an editor, like
 * `usePresence`: the page tree, breadcrumb and backlinks are chrome outside
 * the document, and they must work on a screen with no editor mounted.
 */

export type PageStatus = "loading" | "ready" | "missing";

export interface PageState {
  page: PageMeta | undefined;
  /** `loading` until `store.load` settles on a cache miss; `missing` if it resolves empty or rejects. */
  status: PageStatus;
}

/** Re-renders on every store notification and hands back a counter to key effects on. */
function useStoreVersion(store: PageStore): { version: number; bump: () => void } {
  const [version, bump] = useReducer((count: number) => count + 1, 0);

  useEffect(() => store.subscribe(bump), [store]);

  return { version, bump };
}

/**
 * One page's metadata, live. Reads the store's synchronous cache and calls
 * `store.load` on a miss, so the first render of a link to an uncached page
 * shows `loading` rather than flashing `missing`.
 */
export function usePage(store: PageStore, pageId: string | null | undefined): PageState {
  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  const page = useSyncExternalStore(
    subscribe,
    () => (pageId ? store.peek(pageId) : undefined),
    () => undefined,
  );
  const [missingId, setMissingId] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId || page) return;

    let live = true;

    store.load(pageId).then(
      (loaded) => live && !loaded && setMissingId(pageId),
      () => live && setMissingId(pageId),
    );

    return () => {
      live = false;
    };
  }, [store, pageId, page]);

  if (page) return { page, status: "ready" };

  return { page: undefined, status: !pageId || missingId === pageId ? "missing" : "loading" };
}

export interface PageTreeRow {
  page: PageMeta;
  /** `0` for children of the root. */
  depth: number;
  expanded: boolean;
  /** `true` while this row's children are being fetched for the first time. */
  loading: boolean;
}

export interface UsePageTreeOptions {
  /** Pages expanded on mount, e.g. the ancestors of the open page. */
  defaultExpanded?: readonly string[];
}

export interface PageTree {
  /** Visible rows in display order; trashed pages are left out. */
  rows: PageTreeRow[];
  toggle: (pageId: string) => void;
  expand: (pageId: string) => void;
  collapse: (pageId: string) => void;
}

/**
 * A lazily expanded page tree. Children load through `store.listChildren`
 * when a row is first expanded, and every loaded level is refetched when the
 * store notifies, so renames, new pages and trashing show without a reload.
 */
export function usePageTree(
  store: PageStore,
  rootId: string | null = null,
  options: UsePageTreeOptions = {},
): PageTree {
  const [children, setChildren] = useState<ReadonlyMap<string | null, PageMeta[]>>(new Map());
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(options.defaultExpanded),
  );
  const { version } = useStoreVersion(store);
  const loaded = useRef(new Set<string | null>());

  useEffect(() => {
    let live = true;
    const targets: (string | null)[] = [rootId, ...expandedIds];

    for (const parentId of targets) {
      Promise.resolve(store.listChildren(parentId)).then(
        (list) => {
          if (!live) return;
          loaded.current.add(parentId);
          setChildren((previous) => new Map(previous).set(parentId, list));
        },
        () => live && loaded.current.add(parentId),
      );
    }

    return () => {
      live = false;
    };
  }, [store, rootId, expandedIds, version]);

  const rows = useMemo(() => {
    const out: PageTreeRow[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const page of children.get(parentId) ?? []) {
        if (page.trashed) continue;

        const expanded = expandedIds.has(page.id);

        out.push({ page, depth, expanded, loading: expanded && !children.has(page.id) });

        if (expanded) walk(page.id, depth + 1);
      }
    };

    walk(rootId, 0);

    return out;
  }, [children, expandedIds, rootId]);

  const expand = useCallback(
    (pageId: string) => setExpandedIds((previous) => new Set(previous).add(pageId)),
    [],
  );
  const collapse = useCallback(
    (pageId: string) =>
      setExpandedIds((previous) => {
        const next = new Set(previous);
        next.delete(pageId);
        return next;
      }),
    [],
  );
  const toggle = useCallback(
    (pageId: string) =>
      setExpandedIds((previous) => {
        const next = new Set(previous);
        if (!next.delete(pageId)) next.add(pageId);
        return next;
      }),
    [],
  );

  return { rows, toggle, expand, collapse };
}

/**
 * Ancestors of a page from the root down, ending with the page itself.
 * Walks `parentId` through the store's cache and loads whatever is missing,
 * so the trail fills in as ancestors arrive. Stops at an unknown ancestor.
 */
export function useBreadcrumb(store: PageStore, pageId: string | null | undefined): PageMeta[] {
  const { version, bump } = useStoreVersion(store);

  const { trail, missingId } = useMemo(() => {
    const trail: PageMeta[] = [];
    const seen = new Set<string>();
    let current: string | null | undefined = pageId;
    let missingId: string | null = null;

    while (current && !seen.has(current)) {
      seen.add(current);

      const page = store.peek(current);

      if (!page) {
        missingId = current;
        break;
      }

      trail.unshift(page);
      current = page.parentId;
    }

    return { trail, missingId };
    // `version` invalidates the walk when the store reports a change.
  }, [store, pageId, version]);

  useEffect(() => {
    if (!missingId) return;

    let live = true;

    store.load(missingId).then(
      () => live && bump(),
      () => {},
    );

    return () => {
      live = false;
    };
  }, [store, missingId, bump]);

  return trail;
}

export interface Backlinks {
  pages: PageMeta[];
  loading: boolean;
}

/**
 * Pages that reference `pageId`, from `store.backlinks` (the host's index,
 * fed by `collectPageRefs`). Empty when the store keeps no index. Refetches
 * on every store notification; trashed pages are left out.
 */
export function useBacklinks(store: PageStore, pageId: string | null | undefined): Backlinks {
  const { version } = useStoreVersion(store);
  // Remembers which page a result belongs to, so a page change never shows the previous
  // page's backlinks, while a store notification refetches without blanking the list.
  const [state, setState] = useState<{ forId: string | null | undefined } & Backlinks>({
    forId: undefined,
    pages: [],
    loading: true,
  });
  const indexed = Boolean(pageId) && typeof store.backlinks === "function";

  useEffect(() => {
    if (!pageId || !store.backlinks) return;

    let live = true;

    Promise.resolve(store.backlinks(pageId))
      .then((ids) =>
        Promise.all(ids.map((id) => Promise.resolve(store.peek(id) ?? store.load(id)))),
      )
      .then(
        (found) =>
          live &&
          setState({
            forId: pageId,
            pages: found.filter((page): page is PageMeta => Boolean(page) && !page?.trashed),
            loading: false,
          }),
        () => live && setState({ forId: pageId, pages: [], loading: false }),
      );

    return () => {
      live = false;
    };
  }, [store, pageId, version]);

  if (!indexed) return { pages: [], loading: false };
  if (state.forId !== pageId) return { pages: [], loading: true };

  return state;
}
