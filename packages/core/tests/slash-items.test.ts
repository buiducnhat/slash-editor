import type { Editor } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { defaultSlashItems, filterSlashItems, type SlashItem } from "../src/index.ts";

/** Only the schema is read by `SlashItem.when`. */
function editorWith(nodes: string[]): Editor {
  return {
    schema: { nodes: Object.fromEntries(nodes.map((name) => [name, {}])) },
  } as unknown as Editor;
}

const ids = (items: SlashItem[]) => items.map((item) => item.id);

test("an empty query keeps registry order", () => {
  expect(ids(filterSlashItems(defaultSlashItems, ""))).toEqual(ids(defaultSlashItems));
  expect(ids(filterSlashItems(defaultSlashItems, "   "))).toEqual(ids(defaultSlashItems));
});

test("title prefixes outrank alias and keyword matches", () => {
  // "Code block" starts with the query; "Blockquote" only contains it.
  expect(ids(filterSlashItems(defaultSlashItems, "code"))).toEqual(["code-block"]);
  // "h1" is an alias of Heading 1 and matches nothing else.
  expect(ids(filterSlashItems(defaultSlashItems, "h1"))).toEqual(["heading-1"]);
  // "Bulleted list", "Numbered list", "To-do list", "Toggle list" all match on
  // the trailing word, so registry order decides.
  expect(ids(filterSlashItems(defaultSlashItems, "list"))).toEqual([
    "bullet-list",
    "ordered-list",
    "task-list",
    "toggle",
  ]);
});

test("markdown shorthands reach their block through keywords", () => {
  expect(ids(filterSlashItems(defaultSlashItems, "###"))).toEqual(["heading-3"]);
  expect(ids(filterSlashItems(defaultSlashItems, "---"))).toEqual(["horizontal-rule"]);
});

test("a query matching nothing yields no items", () => {
  expect(filterSlashItems(defaultSlashItems, "quozz")).toEqual([]);
});

test("items are hidden when the editor schema cannot host them", () => {
  const editor = editorWith(["paragraph", "heading"]);

  expect(ids(filterSlashItems(defaultSlashItems, "", editor))).toEqual([
    "paragraph",
    "heading-1",
    "heading-2",
    "heading-3",
  ]);
  expect(filterSlashItems(defaultSlashItems, "code", editor)).toEqual([]);
});

test("callout, toggle, and task-list are gated on their own node types", () => {
  const editor = editorWith(["paragraph", "callout", "details", "taskList"]);

  expect(ids(filterSlashItems(defaultSlashItems, "callout", editor))).toEqual(["callout"]);
  expect(ids(filterSlashItems(defaultSlashItems, "toggle", editor))).toEqual([
    "toggle",
    "toggle-heading-1",
    "toggle-heading-2",
    "toggle-heading-3",
  ]);
  expect(ids(filterSlashItems(defaultSlashItems, "todo", editor))).toEqual(["task-list"]);
  expect(filterSlashItems(defaultSlashItems, "callout", editorWith(["paragraph"]))).toEqual([]);
});

test("ranking is stable for equally scored items", () => {
  const items: SlashItem[] = [
    { id: "b", title: "Board", group: "g", run: () => {} },
    { id: "a", title: "Book", group: "g", run: () => {} },
  ];

  expect(ids(filterSlashItems(items, "bo"))).toEqual(["b", "a"]);
});
