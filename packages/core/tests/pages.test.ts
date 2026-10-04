import { getSchema, type JSONContent } from "@tiptap/core";
import { EditorState, type Transaction } from "@tiptap/pm/state";
import { expect, test } from "vite-plus/test";
import {
  collectPageRefs,
  createBlockKit,
  findSubPageConversions,
  type PageMeta,
  type PagesOptions,
  type PageStore,
  subPageDelta,
  withPageMentions,
} from "../src/index.ts";
import { parseMarkdown, serializeMarkdown } from "../src/markdown.ts";

function memoryStore(pages: PageMeta[]): PageStore {
  const byId = new Map(pages.map((page) => [page.id, page]));

  return {
    create: ({ parentId }) => ({ id: "new", parentId, title: "" }),
    update: () => {},
    peek: (id) => byId.get(id),
    load: async (id) => byId.get(id),
    listChildren: (parentId) => pages.filter((page) => page.parentId === parentId),
    search: (query) => pages.filter((page) => page.title.toLowerCase().includes(query)),
    subscribe: () => () => {},
  };
}

const store = memoryStore([
  { id: "a", parentId: "root", title: "Roadmap" },
  { id: "b", parentId: "root", title: "Notes" },
  { id: "c", parentId: "elsewhere", title: "Foreign" },
]);
const options: PagesOptions = {
  store,
  currentPageId: "root",
  onNavigate: () => {},
  resolveHref: (id) => `/p/${id}`,
};
const kit = createBlockKit({ pages: options });
const schema = getSchema(kit);

const sub = (pageId: string): JSONContent => ({ type: "subPage", attrs: { pageId } });
const para = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });
const stateOf = (json: JSONContent) =>
  EditorState.create({ schema, doc: schema.nodeFromJSON(json) });
/** Position of the `n`-th top-level node. */
const posOf = (state: EditorState, n: number) => {
  let pos = 0;
  for (let i = 0; i < n; i++) pos += state.doc.child(i).nodeSize;
  return pos;
};

test("pages nodes exist only when a store is configured", () => {
  const names = (kitOptions?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(kitOptions).map((extension) => extension.name);

  expect(names()).not.toEqual(expect.arrayContaining(["subPage"]));
  expect(names({ pages: options })).toEqual(
    expect.arrayContaining(["subPage", "pageLink", "pages"]),
  );
});

test("collectPageRefs finds blocks and links at any depth, once each", () => {
  const refs = collectPageRefs(
    doc(
      sub("a"),
      {
        type: "details",
        content: [
          { type: "detailsSummary", content: [{ type: "text", text: "t" }] },
          {
            type: "detailsContent",
            content: [sub("b"), para({ type: "pageLink", attrs: { pageId: "c" } })],
          },
        ],
      },
      para(
        { type: "pageLink", attrs: { pageId: "c" } },
        { type: "pageLink", attrs: { pageId: "a" } },
      ),
    ),
  );

  expect(refs).toEqual({ subPages: ["a", "b"], links: ["c", "a"] });
});

test("deleting a sub-page block reports it detached; restoring it reports it attached", () => {
  const before = stateOf(doc(para(), sub("a"), para()));
  const at = posOf(before, 1);
  const removal = before.tr.delete(at, at + 1);

  expect(subPageDelta([removal])).toEqual({ attached: [], detached: ["a"] });

  const restore = stateOf(doc(para(), para())).tr.insert(at, schema.nodeFromJSON(sub("a")));

  expect(subPageDelta([restore])).toEqual({ attached: ["a"], detached: [] });
});

test("moving a sub-page block in one transaction reports nothing", () => {
  const state = stateOf(doc(sub("a"), para(), para()));
  const tr = state.tr.delete(0, 1).insert(posOf(state, 2) - 1, schema.nodeFromJSON(sub("a")));

  expect(subPageDelta([tr])).toEqual({ attached: [], detached: [] });
});

test("a collaborator's edit is not reported, but the local user's Yjs undo is", () => {
  const state = stateOf(doc(para(), sub("a")));
  const at = posOf(state, 1);
  const withMeta = (meta: object): Transaction =>
    state.tr.delete(at, at + 1).setMeta("y-sync$", meta);

  expect(subPageDelta([withMeta({ isChangeOrigin: true, isUndoRedoOperation: false })])).toEqual({
    attached: [],
    detached: [],
  });
  expect(subPageDelta([withMeta({ isChangeOrigin: true, isUndoRedoOperation: true })])).toEqual({
    attached: [],
    detached: ["a"],
  });
});

test("a pasted copy of a sub-page already in the document becomes a link target, the original stays", () => {
  const state = stateOf(doc(sub("a"), para(), sub("a")));
  const pasted = { from: posOf(state, 2), to: state.doc.content.size };
  const conversions = findSubPageConversions(state.doc, [pasted], () => true);

  expect(conversions.map((entry) => entry.pos)).toEqual([pasted.from]);
});

test("a sub-page owned by another parent converts; a first fresh copy of an own page does not", () => {
  const state = stateOf(doc(sub("a"), sub("c")));
  const all = [{ from: 0, to: state.doc.content.size }];
  const owned = (pageId: string) => store.peek(pageId)?.parentId === "root";

  expect(
    findSubPageConversions(state.doc, all, owned).map((entry) => entry.node.attrs.pageId),
  ).toEqual(["c"]);
});

test("markdown writes a titled link around the page id and reads only the id back", () => {
  const input = doc(
    sub("a"),
    para({ type: "text", text: "see " }, { type: "pageLink", attrs: { pageId: "b" } }),
  );
  const markdown = serializeMarkdown(input, kit);

  expect(markdown).toContain("[Roadmap](/p/a)");
  expect(markdown).toContain("[Notes](/p/b)");

  expect(collectPageRefs(parseMarkdown(markdown, kit))).toEqual({ subPages: ["a"], links: ["b"] });
});

test("a page link opening or filling a paragraph survives a markdown round trip", () => {
  const link: JSONContent = { type: "pageLink", attrs: { pageId: "b" } };
  const input = doc(
    para(link, { type: "text", text: " starts" }),
    para({ type: "text", text: "ends " }, link),
    para(link),
  );
  const markdown = serializeMarkdown(input, kit);
  const parsed = schema.nodeFromJSON(parseMarkdown(markdown, kit));

  expect(parsed.toJSON()).toEqual(schema.nodeFromJSON(input).toJSON());
  expect(serializeMarkdown(parsed.toJSON(), kit)).toBe(markdown);
});

test("a hand-written link without markers stays a plain link", () => {
  const parsed = parseMarkdown("[Roadmap](/p/a)", kit);

  expect(collectPageRefs(parsed)).toEqual({ subPages: [], links: [] });
});

test("page mentions are merged after the host's items and skip trashed pages", async () => {
  const trashed = memoryStore([
    { id: "a", parentId: "root", title: "Roadmap" },
    { id: "x", parentId: "root", title: "Roadmap old", trashed: true },
    { id: "y", parentId: "root", title: "" },
  ]);
  const { items } = withPageMentions(
    { items: () => [{ id: "u1", label: "Ada" }] },
    {
      ...options,
      store: { ...trashed, search: () => [...(trashed.listChildren("root") as PageMeta[])] },
    },
  );
  const context = { editor: undefined as never, signal: new AbortController().signal };

  expect(await items("", context)).toEqual([
    { id: "u1", label: "Ada" },
    { id: "a", label: "Roadmap", icon: "file-text", kind: "page" },
    { id: "y", label: "Untitled", icon: "file-text", kind: "page" },
  ]);
});
