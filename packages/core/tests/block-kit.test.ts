import { getSchema, Node } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit } from "../src/index.ts";

test("baseline schema carries the block types the editor advertises", () => {
  const schema = getSchema(createBlockKit());

  expect(Object.keys(schema.nodes)).toEqual(
    expect.arrayContaining([
      "doc",
      "text",
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "codeBlock",
      "horizontalRule",
      "hardBreak",
    ]),
  );
  expect(Object.keys(schema.marks)).toEqual(
    expect.arrayContaining(["bold", "italic", "strike", "code", "link"]),
  );
});

test("documents survive a JSON round trip through the schema", () => {
  const schema = getSchema(createBlockKit());
  const doc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "bold" },
                  { type: "text", text: " tail" },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("extend registers custom nodes in the schema", () => {
  const callout = Node.create({
    name: "callout",
    group: "block",
    content: "block+",
    parseHTML: () => [{ tag: "aside" }],
    renderHTML: () => ["aside", 0],
  });

  const schema = getSchema(createBlockKit({ extend: [callout] }));

  expect(schema.nodes.callout).toBeDefined();
  expect(
    schema.nodeFromJSON({
      type: "callout",
      content: [{ type: "paragraph", content: [{ type: "text", text: "note" }] }],
    }).type.name,
  ).toBe("callout");
});

test("history: false disables undo/redo so a collaboration provider can own it", () => {
  const [starterKit] = createBlockKit({ history: false });

  expect(starterKit.options.undoRedo).toBe(false);
});

test("heading levels are configurable", () => {
  const [starterKit] = createBlockKit({ headingLevels: [1, 2] });

  expect(starterKit.options.heading.levels).toEqual([1, 2]);
});

test("the slash menu ships with the kit and can be opted out or retriggered", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("slashCommand");
  expect(names({ slash: false })).not.toContain("slashCommand");

  const slash = createBlockKit({ slash: { char: ";" } }).find(
    (extension) => extension.name === "slashCommand",
  );

  expect(slash?.options.char).toBe(";");
});
