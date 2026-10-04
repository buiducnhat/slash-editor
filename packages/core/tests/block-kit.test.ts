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
      "taskList",
      "taskItem",
      "blockquote",
      "callout",
      "details",
      "detailsSummary",
      "detailsContent",
      "codeBlock",
      "horizontalRule",
      "hardBreak",
      "image",
      "file",
      "video",
      "embed",
      "table",
      "tableRow",
      "tableHeader",
      "tableCell",
      "columns",
      "column",
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
      {
        type: "heading",
        attrs: { id: null, level: 2 },
        content: [{ type: "text", text: "Title" }],
      },
      {
        type: "bulletList",
        attrs: { id: null },
        content: [
          {
            type: "listItem",
            attrs: { id: null },
            content: [
              {
                type: "paragraph",
                attrs: { id: null },
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
  const note = Node.create({
    name: "note",
    group: "block",
    content: "block+",
    parseHTML: () => [{ tag: "aside" }],
    renderHTML: () => ["aside", 0],
  });

  const schema = getSchema(createBlockKit({ extend: [note] }));

  expect(schema.nodes.note).toBeDefined();
  expect(
    schema.nodeFromJSON({
      type: "note",
      content: [{ type: "paragraph", content: [{ type: "text", text: "note" }] }],
    }).type.name,
  ).toBe("note");
});

test("history: false disables undo/redo so a collaboration provider can own it", () => {
  const [starterKit] = createBlockKit({ history: false });

  expect(starterKit.options.undoRedo).toBe(false);
});

test("heading levels are configurable", () => {
  const [starterKit] = createBlockKit({ headingLevels: [1, 2] });

  expect(starterKit.options.heading.levels).toEqual([1, 2]);
});

test("starterKit options pass through without overriding the kit's dedicated options", () => {
  const extensions = createBlockKit({
    headingLevels: [1, 2],
    starterKit: { underline: false },
  });
  const schema = getSchema(extensions);

  expect(getSchema(createBlockKit()).marks.underline).toBeDefined();
  expect(schema.marks.underline).toBeUndefined();
  expect(schema.marks.bold).toBeDefined();
  expect(extensions[0].options.heading.levels).toEqual([1, 2]);
  expect(extensions[0].options.blockquote).toBe(false);
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

test("the bubble toolbar ships with the kit and can be opted out or reconfigured", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("bubbleToolbar");
  expect(names({ bubbleToolbar: false })).not.toContain("bubbleToolbar");

  const toolbar = createBlockKit({ bubbleToolbar: { items: [] } }).find(
    (extension) => extension.name === "bubbleToolbar",
  );

  expect(toolbar?.options.items).toEqual([]);
});

test("the document outline ships with the kit and can be opted out or reconfigured", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("tableOfContents");
  expect(names({ tableOfContents: false })).not.toContain("tableOfContents");

  const outline = createBlockKit({ tableOfContents: { maxLevel: 2 } }).find(
    (extension) => extension.name === "tableOfContents",
  );

  expect(outline?.options.maxLevel).toBe(2);
});

test("link clicks stay inert while editing and can be made live for a read-only document", () => {
  const [baseline] = createBlockKit();

  expect(baseline.options.link).toEqual({ openOnClick: false, enableClickSelection: true });

  const [viewer] = createBlockKit({ link: { openOnClick: true } });
  expect(viewer.options.link).toEqual({ openOnClick: true, enableClickSelection: true });

  const [withoutLink] = createBlockKit({ link: false });
  expect(withoutLink.options.link).toBe(false);
});

test("task item options pass through for read-only checkboxes", () => {
  const onReadOnlyChecked = () => true;
  const taskItem = createBlockKit({ taskItem: { onReadOnlyChecked } }).find(
    (extension) => extension.name === "taskItem",
  );

  expect(taskItem?.options.onReadOnlyChecked).toBe(onReadOnlyChecked);
  expect(taskItem?.options.nested).toBe(true);
});
