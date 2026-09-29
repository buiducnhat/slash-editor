import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import {
  computeTableOfContents,
  createBlockKit,
  findActiveItem,
  pickActiveByScroll,
  type TableOfContentsItem,
} from "../src/index.ts";

function schemaWithDocs() {
  return getSchema(createBlockKit());
}

test("the outline lists top-level headings in document order, addressing each one", () => {
  const schema = schemaWithDocs();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { id: "one", level: 1 },
        content: [{ type: "text", text: "Overview" }],
      },
      { type: "paragraph", content: [{ type: "text", text: "body" }] },
      {
        type: "heading",
        attrs: { id: "two", level: 2 },
        content: [{ type: "text", marks: [{ type: "bold" }], text: "Details" }],
      },
      { type: "heading", attrs: { id: null, level: 3 }, content: [{ type: "text", text: "Deep" }] },
    ],
  });

  const items = computeTableOfContents(doc);

  expect(items.map(({ id, level, text }) => ({ id, level, text }))).toEqual([
    { id: "one", level: 1, text: "Overview" },
    { id: "two", level: 2, text: "Details" },
    { id: null, level: 3, text: "Deep" },
  ]);
  // `pos` is what scrolling and caret placement use: each one must land on the
  // very node the row was built from.
  for (const item of items) {
    expect(doc.nodeAt(item.pos)?.type.name).toBe("heading");
    expect(doc.nodeAt(item.pos)?.textContent).toBe(item.text);
  }
});

test("headings nested inside containers stay out of the outline", () => {
  const schema = schemaWithDocs();
  const heading = (text: string) => ({
    type: "heading",
    attrs: { id: null, level: 2 },
    content: [{ type: "text", text }],
  });
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      heading("Top"),
      {
        type: "callout",
        attrs: { id: null, icon: "💡" },
        content: [heading("In a callout")],
      },
      {
        type: "details",
        attrs: { id: null, open: true, level: 2 },
        content: [
          { type: "detailsSummary", content: [{ type: "text", text: "Toggle" }] },
          { type: "detailsContent", content: [heading("In a toggle")] },
        ],
      },
      {
        type: "columns",
        attrs: { id: null },
        content: [
          { type: "column", content: [heading("In a column")] },
          {
            type: "column",
            content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }],
          },
        ],
      },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                content: [heading("In a table cell")],
              },
            ],
          },
        ],
      },
    ],
  });

  expect(computeTableOfContents(doc).map((item) => item.text)).toEqual(["Top"]);
});

test("maxLevel drops headings deeper than it", () => {
  const schema = schemaWithDocs();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { id: null, level: 1 },
        content: [{ type: "text", text: "One" }],
      },
      {
        type: "heading",
        attrs: { id: null, level: 2 },
        content: [{ type: "text", text: "Two" }],
      },
      {
        type: "heading",
        attrs: { id: null, level: 3 },
        content: [{ type: "text", text: "Three" }],
      },
    ],
  });

  expect(computeTableOfContents(doc, { maxLevel: 2 }).map((item) => item.text)).toEqual([
    "One",
    "Two",
  ]);
});

test("a document without headings has no outline", () => {
  const schema = schemaWithDocs();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "nothing to outline" }] }],
  });

  expect(computeTableOfContents(doc)).toEqual([]);
});

const ITEMS: TableOfContentsItem[] = [
  { id: "a", level: 1, text: "Alpha", pos: 10 },
  { id: "b", level: 2, text: "Beta", pos: 40 },
  { id: "c", level: 1, text: "Gamma", pos: 90 },
];

test("findActiveItem highlights the last heading at or before the caret", () => {
  expect(findActiveItem(ITEMS, 5)).toBe(null);
  expect(findActiveItem(ITEMS, 10)?.id).toBe("a");
  expect(findActiveItem(ITEMS, 20)?.id).toBe("a");
  expect(findActiveItem(ITEMS, 40)?.id).toBe("b");
  expect(findActiveItem(ITEMS, 89)?.id).toBe("b");
  expect(findActiveItem(ITEMS, 120)?.id).toBe("c");
  expect(findActiveItem([], 120)).toBe(null);
});

test("pickActiveByScroll highlights the last heading whose top has reached the anchor", () => {
  const rects = [{ top: 100 }, { top: 300 }, { top: 500 }];

  expect(pickActiveByScroll(rects, 0, 250)).toBe(0);
  expect(pickActiveByScroll(rects, 0, 300)).toBe(1);
  expect(pickActiveByScroll(rects, 0, 301)).toBe(1);
  expect(pickActiveByScroll(rects, 0, 900)).toBe(2);
  expect(pickActiveByScroll(rects, 0, 50)).toBe(-1);
  expect(pickActiveByScroll([], 0, 50)).toBe(-1);
  // The container's own top is an offset into the same viewport as the rects.
  expect(pickActiveByScroll(rects, 200, 101)).toBe(1);
});
