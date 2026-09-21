import { getSchema } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { expect, test } from "vite-plus/test";
import { createBlockKit, placeholderKeyFor } from "../src/index.ts";

const schema = getSchema(createBlockKit());

const node = (type: string, attrs?: Record<string, unknown>): Node =>
  schema.nodes[type].create(attrs);

test("headings resolve to their level's slot, and only the offered levels", () => {
  expect(placeholderKeyFor(node("heading", { level: 1 }), null)).toBe("heading1");
  expect(placeholderKeyFor(node("heading", { level: 3 }), null)).toBe("heading3");
  // `headingLevels` defaults to 1-3; a level the editor never offers has no slot.
  expect(placeholderKeyFor(node("heading", { level: 6 }), null)).toBeNull();
});

test("an empty paragraph takes its slot from the block that contains it", () => {
  // The empty node inside a list item, task item, quote or callout is always a
  // paragraph — node type alone cannot tell these apart.
  expect(placeholderKeyFor(node("paragraph"), node("listItem"))).toBe("listItem");
  expect(placeholderKeyFor(node("paragraph"), node("taskItem"))).toBe("taskItem");
  expect(placeholderKeyFor(node("paragraph"), node("blockquote"))).toBe("blockquote");
  expect(placeholderKeyFor(node("paragraph"), node("callout"))).toBe("callout");
  expect(placeholderKeyFor(node("paragraph"), node("detailsContent"))).toBe("details");
  expect(placeholderKeyFor(node("paragraph"), node("doc"))).toBe("paragraph");
  expect(placeholderKeyFor(node("paragraph"), null)).toBe("paragraph");
});

test("code blocks stay blank, because a hint there reads as source", () => {
  expect(placeholderKeyFor(node("codeBlock"), node("doc"))).toBeNull();
});

test("a toggle's summary line gets its own slot", () => {
  expect(placeholderKeyFor(node("detailsSummary"), node("details"))).toBe("details");
});

test("placeholder: false removes the extension from the kit", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("placeholder");
  expect(names({ placeholder: false })).not.toContain("placeholder");
});
