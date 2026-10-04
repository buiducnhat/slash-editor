import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { emoji, searchEmojis, type EmojiItem } from "../src/emoji.ts";
import { createBlockKit, defaultSlashItems, filterSlashItems } from "../src/index.ts";
import { parseMarkdown, serializeMarkdown } from "../src/markdown.ts";

const kit = createBlockKit({ emoji: emoji() });
const names = (options?: Parameters<typeof createBlockKit>[0]) =>
  createBlockKit(options).map((extension) => extension.name);

test("emoji is opt-in and brings the /emoji slash item with it", () => {
  expect(names()).not.toContain("emoji");
  expect(names({ emoji: emoji() })).toContain("emoji");
  expect(names({ emoji: false })).not.toContain("emoji");

  const withEmoji = { schema: { nodes: { emoji: {} } } } as never;
  const without = { schema: { nodes: {} } } as never;

  expect(filterSlashItems(defaultSlashItems, "emoji", withEmoji).map((i) => i.id)).toEqual([
    "emoji",
  ]);
  expect(filterSlashItems(defaultSlashItems, "emoji", without)).toEqual([]);
});

test("searchEmojis ranks name prefix over shortcode, substring, and tag matches", () => {
  const emojis: EmojiItem[] = [
    { name: "tag_hit", emoji: "a", shortcodes: ["x1"], tags: ["smile"] },
    { name: "big_smile", emoji: "b", shortcodes: ["x2"], tags: [] },
    { name: "x3", emoji: "c", shortcodes: ["smiley"], tags: [] },
    { name: "smile", emoji: "d", shortcodes: ["x4"], tags: [] },
    { name: "regional_indicator_s", emoji: "🇸", shortcodes: ["regional_indicator_s"], tags: [] },
    { name: "no_glyph", shortcodes: ["no_glyph"], tags: [] },
  ];

  expect(searchEmojis(emojis, "smile", 10).map((e) => e.name)).toEqual([
    "smile",
    "x3",
    "big_smile",
    "tag_hit",
  ]);
  expect(searchEmojis(emojis, "SMILE", 1).map((e) => e.name)).toEqual(["smile"]);
  expect(searchEmojis(emojis, "nothing", 10)).toEqual([]);
  // Regional-indicator letters are never offered, with or without a query.
  expect(searchEmojis(emojis, "", 10).map((e) => e.name)).toEqual([
    "tag_hit",
    "big_smile",
    "x3",
    "smile",
  ]);
});

test("emoji nodes round-trip through markdown as :shortcode:", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "ship it " },
          { type: "emoji", attrs: { name: "rocket" } },
          { type: "text", text: " now" },
        ],
      },
    ],
  };

  const markdown = serializeMarkdown(doc, kit);
  expect(markdown).toBe("ship it :rocket: now");

  const schema = getSchema(kit);
  expect(schema.nodeFromJSON(parseMarkdown(markdown, kit)).toJSON()).toEqual(
    schema.nodeFromJSON(doc).toJSON(),
  );
});

test("an unknown :shortcode: stays plain text on markdown import", () => {
  const parsed = parseMarkdown("meet at 12:30:45 :nope_not_real:", kit);
  const inline = parsed.content?.[0]?.content ?? [];

  expect(inline.some((node) => node.type === "emoji")).toBe(false);
  expect(inline.map((node) => node.text).join("")).toBe("meet at 12:30:45 :nope_not_real:");
});
