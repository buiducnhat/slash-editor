import {
  combineTransactionSteps,
  type Editor,
  Extension,
  type Extensions,
  getChangedRanges,
  type JSONContent,
  mergeAttributes,
  Node,
  type NodeViewRenderer,
  type Range,
} from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import type { MentionItem, MentionOptions } from "./mention.ts";
import {
  readLinkLine,
  readMarker,
  renderClosingMarker,
  renderLinkLine,
  renderMarker,
  markerStart,
} from "./markdown-syntax.ts";
import type { SlashItem } from "./slash-items.ts";

/** Metadata the host owns for one page. The document body never carries any of it. */
export interface PageMeta {
  id: string;
  parentId: string | null;
  title: string;
  /** Emoji or host-resolved icon key. */
  icon?: string;
  /** Cover image URL. */
  cover?: string;
  /** `true` once the page sits in the host's trash. */
  trashed?: boolean;
}

/**
 * Host-provided page directory. Titles, icons and the tree live here — never
 * in the document — so a rename shows up in every sub-page block and link at
 * once. `peek` must return a stable object until that page changes.
 */
export interface PageStore {
  create(input: { parentId: string | null; title?: string }): PageMeta | Promise<PageMeta>;
  update(
    id: string,
    patch: Partial<Pick<PageMeta, "title" | "icon" | "cover">>,
  ): void | Promise<void>;
  /** Synchronous cache read, used by node views and markdown export. */
  peek(id: string): PageMeta | undefined;
  /** Fills the cache on a miss. Resolves `undefined` for an unknown page. */
  load(id: string): Promise<PageMeta | undefined>;
  listChildren(parentId: string | null): PageMeta[] | Promise<PageMeta[]>;
  /** Backs the page entries of the `@` menu. */
  search(query: string, context: { signal: AbortSignal }): PageMeta[] | Promise<PageMeta[]>;
  /** Ids of the pages referencing `id`, from an index the host keeps with `collectPageRefs`. */
  backlinks?(id: string): string[] | Promise<string[]>;
  /** Notifies after local or remote changes to any page. */
  subscribe(listener: () => void): () => void;
}

export interface PagesOptions {
  store: PageStore;
  /** The page this editor shows; `null` for a root-level document. */
  currentPageId: string | null;
  /** Opens a page. The host routes; the library knows no URLs. */
  onNavigate: (pageId: string) => void;
  /** Sub-page blocks left the document through a local edit (delete, cut). */
  onSubPagesDetached?: (pageIds: string[]) => void;
  /** Sub-page blocks entered the document through a local edit (undo, paste). */
  onSubPagesAttached?: (pageIds: string[]) => void;
  /** Href written for a page in markdown export. @default `#<pageId>` */
  resolveHref?: (pageId: string) => string;
  /** Called when `store.create` rejects. Nothing is inserted. */
  onError?: (error: unknown, context: { editor: Editor }) => void;
  /**
   * Renderers for the two nodes, so a UI layer attaches its views without
   * re-registering `subPage`/`pageLink` (Tiptap would see a name collision).
   * Without one, the nodes render as plain `data-type` elements.
   */
  nodeViews?: { subPage?: NodeViewRenderer; pageLink?: NodeViewRenderer };
}

export interface PagesStorage {
  options: PagesOptions;
}

declare module "@tiptap/core" {
  interface Storage {
    pages: PagesStorage;
  }
  interface Commands<ReturnType> {
    pages: {
      /**
       * Creates a page under `currentPageId` through the store, inserts a
       * sub-page block for it at the selection, then navigates into it.
       */
      createSubPage: () => ReturnType;
    };
    subPage: {
      /** Inserts a sub-page block referencing an existing page. */
      setSubPage: (pageId: string) => ReturnType;
    };
    pageLink: {
      /** Inserts an inline link to an existing page. */
      setPageLink: (pageId: string) => ReturnType;
    };
  }
}

export const UNTITLED_PAGE = "Untitled";

/** Title to display for a page that may be missing or empty. */
export function pageTitle(page: Pick<PageMeta, "title"> | undefined): string {
  return page?.title.trim() || UNTITLED_PAGE;
}

/** `editor`'s pages configuration, or `undefined` when the kit has no `pages`. */
export function getPagesOptions(editor: Editor): PagesOptions | undefined {
  return (editor.storage.pages as PagesStorage | undefined)?.options;
}

interface PageResolver {
  title(pageId: string): string;
  href(pageId: string): string;
}

const BARE_RESOLVER: PageResolver = { title: (pageId) => pageId, href: (pageId) => `#${pageId}` };

function storeResolver(options: PagesOptions): PageResolver {
  const { store, resolveHref } = options;

  return {
    title: (pageId) => pageTitle(store.peek(pageId)),
    href: (pageId) => resolveHref?.(pageId) ?? `#${pageId}`,
  };
}

const pageIdAttribute = {
  default: null,
  parseHTML: (element: HTMLElement) => element.getAttribute("data-page-id"),
  renderHTML: (attributes: Record<string, unknown>) =>
    attributes.pageId ? { "data-page-id": attributes.pageId } : {},
};

const PAGE_LINK_CLOSE = renderClosingMarker("pageLink");

function buildSubPage(resolve: PageResolver) {
  return Node.create({
    name: "subPage",
    group: "block",
    atom: true,
    selectable: true,

    addAttributes() {
      return { pageId: pageIdAttribute };
    },

    parseHTML() {
      return [{ tag: `div[data-type="${this.name}"]` }];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": this.name }),
        resolve.title(node.attrs.pageId),
      ];
    },

    renderText: ({ node }) => resolve.title(node.attrs.pageId),

    excludeFromMarkdown: (node) => !node.attrs?.pageId,
    renderMarkdown: (node) => {
      const pageId: string = node.attrs?.pageId;

      return `${renderMarker("subPage", { pageId })}\n${renderLinkLine(resolve.title(pageId), resolve.href(pageId))}`;
    },
    markdownTokenizer: {
      name: "subPage",
      level: "block",
      start: markerStart("subPage"),
      tokenize(src) {
        const marker = readMarker(src, "subPage");
        const link = marker && readLinkLine(src.slice(marker.raw.length));
        const pageId = marker?.attrs.pageId;

        if (!marker || !link || link.image || typeof pageId !== "string" || !pageId) {
          return undefined;
        }

        const raw = marker.raw + link.raw;

        // Same rule as the media blocks: text running on from the link line makes it a paragraph.
        if (!/^[ \t]*(?:\n|$)/.test(src.slice(raw.length))) {
          return undefined;
        }

        return { type: "subPage", raw, pageId };
      },
    },
    parseMarkdown: (token, h) => h.createNode("subPage", { pageId: token.pageId }),

    addCommands() {
      return {
        setSubPage:
          (pageId: string) =>
          ({ commands }) =>
            commands.insertContent({ type: this.name, attrs: { pageId } }),
      };
    },
  });
}

function buildPageLink(resolve: PageResolver) {
  return Node.create({
    name: "pageLink",
    group: "inline",
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
      return { pageId: pageIdAttribute };
    },

    parseHTML() {
      return [{ tag: `span[data-type="${this.name}"]` }];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(HTMLAttributes, { "data-type": this.name }),
        resolve.title(node.attrs.pageId),
      ];
    },

    renderText: ({ node }) => resolve.title(node.attrs.pageId),

    // The markers (hidden on GitHub) keep the id around an ordinary link; without
    // them, or with a malformed payload, it imports as that plain link.
    excludeFromMarkdown: (node) => !node.attrs?.pageId,
    renderMarkdown: (node) => {
      const pageId: string = node.attrs?.pageId;

      return `${renderMarker("pageLink", { pageId })}${renderLinkLine(resolve.title(pageId), resolve.href(pageId))}${PAGE_LINK_CLOSE}`;
    },
    markdownTokenizer: {
      name: "pageLink",
      level: "inline",
      start: (src) => src.indexOf("<!-- slash:pageLink"),
      tokenize(src) {
        const marker = readMarker(src, "pageLink", true);
        const close = marker ? src.indexOf(PAGE_LINK_CLOSE, marker.raw.length) : -1;
        const pageId = marker?.attrs.pageId;

        if (!marker || close < 0 || typeof pageId !== "string" || !pageId) {
          return undefined;
        }

        return { type: "pageLink", raw: src.slice(0, close + PAGE_LINK_CLOSE.length), pageId };
      },
    },
    parseMarkdown: (token, h) => h.createNode("pageLink", { pageId: token.pageId }),

    addCommands() {
      return {
        setPageLink:
          (pageId: string) =>
          ({ commands }) =>
            commands.insertContent([
              { type: this.name, attrs: { pageId } },
              { type: "text", text: " " },
            ]),
      };
    },
  });
}

/** Sub-page block without a store: titles and hrefs fall back to the page id. */
export const SubPage = buildSubPage(BARE_RESOLVER);
/** Inline page link without a store: titles and hrefs fall back to the page id. */
export const PageLink = buildPageLink(BARE_RESOLVER);

// ---------------------------------------------------------------------------
// Document analysis
// ---------------------------------------------------------------------------

export interface PageRefs {
  /** Pages this document owns as sub-page blocks, in document order. */
  subPages: string[];
  /** Pages this document links to inline, in document order. */
  links: string[];
}

/**
 * Every page a document references, at any depth (toggles, columns, table
 * cells). Hosts call it with `editor.getJSON()` on save to keep the index
 * behind `PageStore.backlinks` current. Ids are de-duplicated.
 */
export function collectPageRefs(doc: JSONContent): PageRefs {
  const subPages = new Set<string>();
  const links = new Set<string>();

  const visit = (node: JSONContent) => {
    const pageId: unknown = node.attrs?.pageId;

    if (typeof pageId === "string" && pageId) {
      if (node.type === "subPage") subPages.add(pageId);
      else if (node.type === "pageLink") links.add(pageId);
    }

    node.content?.forEach(visit);
  };

  visit(doc);

  return { subPages: [...subPages], links: [...links] };
}

const Y_SYNC_META_KEY = "y-sync$";

interface YSyncMeta {
  isChangeOrigin?: boolean;
  isUndoRedoOperation?: boolean;
}

/**
 * `true` for a transaction a collaborator produced. A local Yjs undo/redo is
 * also stamped `isChangeOrigin`, but with `isUndoRedoOperation`, and still
 * counts as the local user's edit.
 */
export function isRemoteTransaction(tr: Transaction): boolean {
  const meta = tr.getMeta(Y_SYNC_META_KEY) as YSyncMeta | undefined;

  return Boolean(meta?.isChangeOrigin && !meta.isUndoRedoOperation);
}

function subPageIdsIn(doc: ProseMirrorNode, ranges: readonly Range[]): Set<string> {
  const ids = new Set<string>();

  for (const { from, to } of ranges) {
    doc.nodesBetween(from, to, (node) => {
      if (node.type.name === "subPage" && node.attrs.pageId) {
        ids.add(node.attrs.pageId);
      }
    });
  }

  return ids;
}

/**
 * Net sub-page blocks one dispatch removed from, or added to, the document.
 * Looks only at each local transaction's changed ranges, and nets ids across
 * the whole set so a move (delete + insert) or a paste the uniqueness pass
 * immediately converts reports nothing.
 */
export function subPageDelta(transactions: readonly Transaction[]): {
  attached: string[];
  detached: string[];
} {
  const net = new Map<string, number>();
  const bump = (ids: Set<string>, by: number) =>
    ids.forEach((id) => net.set(id, (net.get(id) ?? 0) + by));

  for (const tr of transactions) {
    if (!tr.docChanged || isRemoteTransaction(tr)) continue;

    const ranges = getChangedRanges(tr);

    bump(
      subPageIdsIn(
        tr.before,
        ranges.map((change) => change.oldRange),
      ),
      -1,
    );
    bump(
      subPageIdsIn(
        tr.doc,
        ranges.map((change) => change.newRange),
      ),
      1,
    );
  }

  const attached: string[] = [];
  const detached: string[] = [];

  net.forEach((count, id) => {
    if (count > 0) attached.push(id);
    else if (count < 0) detached.push(id);
  });

  return { attached, detached };
}

/**
 * Positions of sub-page blocks that must become page links: a page has one
 * parent, so a block inside `ranges` whose id already sits elsewhere in the
 * document (a duplicate or a repeated paste), or whose page `isOwned` denies,
 * is only a reference. The first fresh copy of an unowned-by-others id stays.
 */
export function findSubPageConversions(
  doc: ProseMirrorNode,
  ranges: readonly Range[],
  isOwned: (pageId: string) => boolean,
): { pos: number; node: ProseMirrorNode }[] {
  const fresh: { pos: number; node: ProseMirrorNode }[] = [];
  const stableIds = new Set<string>();

  doc.descendants((node, pos) => {
    if (node.type.name !== "subPage" || !node.attrs.pageId) {
      return node.isAtom ? false : true;
    }

    const end = pos + node.nodeSize;

    if (ranges.some((range) => pos < range.to && end > range.from)) {
      fresh.push({ pos, node });
    } else {
      stableIds.add(node.attrs.pageId);
    }

    return false;
  });

  const seen = new Set<string>();

  return fresh.filter(({ node }) => {
    const pageId: string = node.attrs.pageId;
    const convert = !isOwned(pageId) || stableIds.has(pageId) || seen.has(pageId);

    seen.add(pageId);

    return convert;
  });
}

export const pagesPluginKey = new PluginKey("pages");

function buildPages(options: PagesOptions) {
  const { store, currentPageId } = options;

  return Extension.create({
    name: "pages",

    addStorage() {
      // Held by reference: `configure` would deep-clone the store.
      return { options };
    },

    addCommands() {
      return {
        createSubPage:
          () =>
          ({ editor }) => {
            Promise.resolve()
              .then(() => store.create({ parentId: currentPageId }))
              .then((page) => {
                if (editor.isDestroyed) return;

                // A block the schema rejected at this selection must not strand the user on
                // a page nothing in this document points to.
                if (editor.chain().focus().setSubPage(page.id).run()) {
                  options.onNavigate(page.id);
                }
              })
              .catch((error: unknown) => options.onError?.(error, { editor }));

            return true;
          },
      };
    },

    onTransaction({ transaction, appendedTransactions }) {
      if (!options.onSubPagesDetached && !options.onSubPagesAttached) return;

      const { attached, detached } = subPageDelta([transaction, ...appendedTransactions]);

      if (detached.length) options.onSubPagesDetached?.(detached);
      if (attached.length) options.onSubPagesAttached?.(attached);
    },

    addProseMirrorPlugins() {
      const { editor } = this;

      return [
        new Plugin({
          key: pagesPluginKey,
          appendTransaction: (transactions, oldState, newState) => {
            if (
              !transactions.some((tr) => tr.docChanged) ||
              transactions.some((tr) => isRemoteTransaction(tr))
            ) {
              return null;
            }

            const { subPage, pageLink, paragraph } = editor.schema.nodes;

            if (!subPage || !pageLink || !paragraph) return null;

            const ranges = getChangedRanges(
              combineTransactionSteps(oldState.doc, [...transactions]),
            ).map((change) => change.newRange);
            const conversions = findSubPageConversions(newState.doc, ranges, (pageId) => {
              // A page the cache has not seen is treated as ours: loading existing content
              // and `createSubPage` both insert blocks before a host's cache knows them, and
              // converting those would break the very pages the user just made.
              const parentId = store.peek(pageId)?.parentId;

              return parentId === undefined || parentId === currentPageId;
            });

            if (!conversions.length) return null;

            const tr = newState.tr;

            for (const { pos, node } of conversions.reverse()) {
              tr.replaceWith(
                pos,
                pos + node.nodeSize,
                paragraph.create(null, pageLink.create({ pageId: node.attrs.pageId })),
              );
            }

            return tr;
          },
        }),
      ];
    },
  });
}

/**
 * The page nodes, the extension driving them, and nothing else: `subPage`,
 * `pageLink`, and a `pages` extension owning the detach/attach reports, the
 * one-parent rule, and `createSubPage`. `createBlockKit({ pages })` adds the
 * `/page` slash items and `@` menu entries on top.
 */
export function pages(options: PagesOptions): Extensions {
  const resolver = storeResolver(options);
  const { subPage, pageLink } = options.nodeViews ?? {};
  const subPageNode = buildSubPage(resolver);
  const pageLinkNode = buildPageLink(resolver);

  return [
    subPage ? subPageNode.extend({ addNodeView: () => subPage }) : subPageNode,
    pageLink ? pageLinkNode.extend({ addNodeView: () => pageLink }) : pageLinkNode,
    buildPages(options),
  ];
}

// ---------------------------------------------------------------------------
// Slash items and the shared `@` menu
// ---------------------------------------------------------------------------

const PAGES_GROUP = "Pages";

function mentionChar(editor: Editor): string | undefined {
  const mention = editor.extensionManager.extensions.find(
    (extension) => extension.name === "mention",
  );

  return mention ? (mention.options as MentionOptions).char : undefined;
}

/** `/page` and `/link to page`. Both hide themselves when the editor has no `pages` kit. */
export function createPagesSlashItems(): SlashItem[] {
  return [
    {
      id: "page",
      title: "Page",
      group: PAGES_GROUP,
      description: "Create a sub-page inside this page",
      aliases: ["page", "subpage", "sub-page"],
      keywords: ["new", "document"],
      icon: "file-plus",
      when: (editor) => editor.schema.nodes.subPage !== undefined,
      run: ({ editor, range }) => editor.chain().focus().deleteRange(range).createSubPage().run(),
    },
    {
      id: "link-to-page",
      title: "Link to page",
      group: PAGES_GROUP,
      description: "Link an existing page",
      aliases: ["link", "pagelink", "mention"],
      keywords: ["reference", "page"],
      icon: "file-symlink",
      when: (editor) =>
        editor.schema.nodes.pageLink !== undefined && mentionChar(editor) !== undefined,
      // The inserted trigger character opens the `@` menu; the mention extension owns the rest.
      run: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(mentionChar(editor) ?? "@")
          .run(),
    },
  ];
}

/**
 * The `@` menu provider with the store's pages merged in after the host's own
 * items. With no `mention` configured the menu lists pages alone.
 */
export function withPageMentions(
  mention: (Partial<MentionOptions> & Pick<MentionOptions, "items">) | undefined,
  options: PagesOptions,
): Partial<MentionOptions> & Pick<MentionOptions, "items"> {
  const hostItems = mention?.items;

  return {
    ...mention,
    items: async (query, context) => {
      const [own, found] = await Promise.all([
        hostItems?.(query, context) ?? [],
        options.store.search(query, { signal: context.signal }),
      ]);
      const pageItems: MentionItem[] = found
        .filter((page) => !page.trashed)
        .map((page) => ({
          id: page.id,
          label: pageTitle(page),
          icon: "file-text",
          kind: "page",
        }));

      return [...own, ...pageItems];
    },
  };
}
