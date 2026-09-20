import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit } from "../src/index.ts";

test("callout defaults its icon and keeps a custom one through a JSON round trip", () => {
  const schema = getSchema(createBlockKit());

  const defaulted = schema.nodes.callout!.create(null, schema.nodes.paragraph!.createAndFill());
  expect(defaulted.attrs.icon).toBe("💡");

  const doc = {
    type: "doc",
    content: [
      {
        type: "callout",
        attrs: { id: null, icon: "⚠️" },
        content: [
          { type: "paragraph", attrs: { id: null }, content: [{ type: "text", text: "careful" }] },
        ],
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("task items default to unchecked and persist a checked state", () => {
  const schema = getSchema(createBlockKit());

  const unchecked = schema.nodes.taskItem!.create(null, schema.nodes.paragraph!.createAndFill());
  expect(unchecked.attrs.checked).toBe(false);

  const doc = {
    type: "doc",
    content: [
      {
        type: "taskList",
        attrs: { id: null },
        content: [
          {
            type: "taskItem",
            attrs: { id: null, checked: true },
            content: [
              { type: "paragraph", attrs: { id: null }, content: [{ type: "text", text: "done" }] },
            ],
          },
        ],
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("toggle (details) defaults closed and persists its open state", () => {
  const schema = getSchema(createBlockKit());

  const closed = schema.nodes.details!.create(null, [
    schema.nodes.detailsSummary!.createAndFill()!,
    schema.nodes.detailsContent!.createAndFill()!,
  ]);
  expect(closed.attrs.open).toBe(false);

  const doc = {
    type: "doc",
    content: [
      {
        type: "details",
        attrs: { id: null, open: true },
        content: [
          { type: "detailsSummary", content: [{ type: "text", text: "More" }] },
          {
            type: "detailsContent",
            attrs: { id: null },
            content: [
              {
                type: "paragraph",
                attrs: { id: null },
                content: [{ type: "text", text: "hidden" }],
              },
            ],
          },
        ],
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});
