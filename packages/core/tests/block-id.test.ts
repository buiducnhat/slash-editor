import { getSchema } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import type { Plugin } from "@tiptap/pm/state";
import { expect, test } from "vite-plus/test";
import { BLOCK_ID_REMOTE_META, BlockId, createBlockKit } from "../src/index.ts";

function idPlugin(schema: Schema): Plugin {
  const [plugin] = BlockId.config.addProseMirrorPlugins!.call({ editor: { schema } } as never);
  return plugin;
}

test("auto derivation gives an id to block-group nodes and content-block containers, not text", () => {
  const schema = getSchema(createBlockKit());

  expect(schema.nodes.paragraph.spec.attrs?.id).toBeDefined();
  expect(schema.nodes.heading.spec.attrs?.id).toBeDefined();
  // listItem's content is "paragraph block*" — a content-block container, not group "block" itself.
  expect(schema.nodes.listItem.spec.attrs?.id).toBeDefined();
  expect(schema.nodes.text.spec.attrs?.id).toBeUndefined();
  expect(schema.nodes.doc.spec.attrs?.id).toBeUndefined();
});

test("id defaults to null so a missing value never becomes a non-deterministic render", () => {
  const schema = getSchema(createBlockKit());

  expect(schema.nodes.paragraph.spec.attrs?.id.default).toBeNull();
});

test("exclude removes a type from the auto derivation", () => {
  const schema = getSchema(createBlockKit({ blockId: { exclude: ["codeBlock"] } }));

  expect(schema.nodes.codeBlock.spec.attrs?.id).toBeUndefined();
  expect(schema.nodes.paragraph.spec.attrs?.id).toBeDefined();
});

test("an explicit types list opts out of auto derivation", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));

  expect(schema.nodes.paragraph.spec.attrs?.id).toBeDefined();
  expect(schema.nodes.heading.spec.attrs?.id).toBeUndefined();
});

test("blockId can be opted out entirely", () => {
  const schema = getSchema(createBlockKit({ blockId: false }));

  expect(schema.nodes.paragraph.spec.attrs?.id).toBeUndefined();
});

test("a node inserted by a transaction gets an id; untouched siblings keep theirs", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      { type: "paragraph", attrs: { id: "aaa" }, content: [{ type: "text", text: "a" }] },
      { type: "paragraph", attrs: { id: "bbb" }, content: [{ type: "text", text: "b" }] },
    ],
  });
  const state = EditorState.create({ doc, plugins: [idPlugin(schema)] });

  const inserted = schema.nodes.paragraph.create(null, schema.text("new"));
  const next = state.apply(state.tr.insert(doc.child(0).nodeSize, inserted));

  const ids = next.doc.content.content.map((node) => node.attrs.id);
  expect(ids[0]).toBe("aaa");
  expect(ids[2]).toBe("bbb");
  expect(ids[1]).not.toBeNull();
  expect(ids[1]).toHaveLength(12);
});

test("a duplicated id introduced by a transaction is regenerated; the original keeps its id", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [{ type: "paragraph", attrs: { id: "aaa" }, content: [{ type: "text", text: "a" }] }],
  });
  const state = EditorState.create({ doc, plugins: [idPlugin(schema)] });

  // Simulates pasting a copy of the first paragraph, id and all.
  const duplicate = schema.nodes.paragraph.create({ id: "aaa" }, schema.text("copy"));
  const next = state.apply(state.tr.insert(doc.child(0).nodeSize, duplicate));

  const ids = next.doc.content.content.map((node) => node.attrs.id);
  expect(ids[0]).toBe("aaa");
  expect(ids[1]).not.toBe("aaa");
  expect(ids[1]).toHaveLength(12);
});

test("editing inside an existing block does not regenerate its id", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [{ type: "paragraph", attrs: { id: "aaa" }, content: [{ type: "text", text: "a" }] }],
  });
  const state = EditorState.create({ doc, plugins: [idPlugin(schema)] });

  const next = state.apply(state.tr.insertText("!", 2));

  expect(next.doc.child(0).attrs.id).toBe("aaa");
  expect(next.doc.child(0).textContent).toBe("a!");
});

test("a transaction flagged as a remote change is never touched by the assignment pass", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }],
  });
  const state = EditorState.create({ doc, plugins: [idPlugin(schema)] });

  const tr = state.tr.insertText("!", 2);
  tr.setMeta(BLOCK_ID_REMOTE_META, true);
  const next = state.apply(tr);

  expect(next.doc.child(0).attrs.id).toBeNull();
});

test("a transaction that does not change the document produces no follow-up", () => {
  const schema = getSchema(createBlockKit({ blockId: { types: ["paragraph"] } }));
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [{ type: "paragraph", attrs: { id: "aaa" }, content: [{ type: "text", text: "a" }] }],
  });
  const state = EditorState.create({ doc, plugins: [idPlugin(schema)] });

  const next = state.apply(state.tr.setSelection(state.selection));

  expect(next.doc.child(0).attrs.id).toBe("aaa");
});
