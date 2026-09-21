import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit } from "../src/index.ts";

test("mention is left out of the baseline kit until a provider is configured", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).not.toContain("mention");
  expect(names({ mention: { items: () => [] } })).toContain("mention");
});

test("mention defaults to null id/label and persists a JSON round trip", () => {
  const schema = getSchema(createBlockKit({ mention: { items: () => [] } }));

  const empty = schema.nodes.mention!.create();
  expect(empty.attrs).toMatchObject({ id: null, label: null });

  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { id: null },
        content: [
          { type: "text", text: "cc " },
          { type: "mention", attrs: { id: "1", label: "Ada Lovelace" } },
        ],
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("mention accepts a custom trigger char, debounce, and minQueryLength", () => {
  const mention = createBlockKit({
    mention: { items: () => [], char: "#", debounce: 300, minQueryLength: 2 },
  }).find((extension) => extension.name === "mention");

  expect(mention?.options).toMatchObject({ char: "#", debounce: 300, minQueryLength: 2 });
});
