import type { Editor } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import {
  type BubbleToolbarItem,
  defaultBubbleToolbarItems,
  filterBubbleToolbarItems,
} from "../src/index.ts";

/** Only the schema and `isActive` are read by `filterBubbleToolbarItems`/`item.isActive`. */
function editorWith(marks: string[], active: string[] = []): Editor {
  return {
    schema: { marks: Object.fromEntries(marks.map((name) => [name, {}])) },
    isActive: (name: string) => active.includes(name),
  } as unknown as Editor;
}

const ids = (items: BubbleToolbarItem[]) => items.map((item) => item.id);

test("default items cover every baseline mark", () => {
  expect(ids(defaultBubbleToolbarItems)).toEqual(["bold", "italic", "strike", "code"]);
});

test("items are hidden when the editor schema cannot host their mark", () => {
  const editor = editorWith(["bold", "code"]);

  expect(ids(filterBubbleToolbarItems(defaultBubbleToolbarItems, editor))).toEqual([
    "bold",
    "code",
  ]);
});

test("an editor with no formatting marks yields no items", () => {
  expect(filterBubbleToolbarItems(defaultBubbleToolbarItems, editorWith([]))).toEqual([]);
});

test("isActive reflects the live selection's marks", () => {
  const editor = editorWith(["bold", "italic"], ["bold"]);
  const [bold, italic] = filterBubbleToolbarItems(defaultBubbleToolbarItems, editor);

  expect(bold!.isActive(editor)).toBe(true);
  expect(italic!.isActive(editor)).toBe(false);
});
