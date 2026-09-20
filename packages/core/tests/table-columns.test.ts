import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit } from "../src/index.ts";

test("table kit ships a table of resizable cells rooted in block content", () => {
  const schema = getSchema(createBlockKit());

  const table = schema.nodes.table!.createAndFill();
  expect(table).not.toBeNull();
  expect(table!.type.name).toBe("table");

  const json = table!.toJSON();
  expect(schema.nodeFromJSON(json).toJSON()).toEqual(json);
});

test("columns requires at least two columns and persists their content", () => {
  const schema = getSchema(createBlockKit());

  expect(() =>
    schema.nodes.columns!.createChecked(null, schema.nodes.column!.createAndFill()!),
  ).toThrow();

  const doc = {
    type: "doc",
    content: [
      {
        type: "columns",
        attrs: { id: "cols1" },
        content: [
          {
            type: "column",
            attrs: { id: "col1" },
            content: [
              { type: "paragraph", attrs: { id: null }, content: [{ type: "text", text: "left" }] },
            ],
          },
          {
            type: "column",
            attrs: { id: "col2" },
            content: [
              {
                type: "paragraph",
                attrs: { id: null },
                content: [{ type: "text", text: "right" }],
              },
            ],
          },
        ],
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("table and columns can be opted out of the block kit", () => {
  const schema = getSchema(createBlockKit({ table: false, columns: false }));

  expect(schema.nodes.table).toBeUndefined();
  expect(schema.nodes.tableRow).toBeUndefined();
  expect(schema.nodes.columns).toBeUndefined();
  expect(schema.nodes.column).toBeUndefined();
});
