import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { expect, test } from "vite-plus/test";
import { activeThreadIds, createBlockKit } from "../src/index.ts";

function stateWithComment(threadId: string) {
  const schema = getSchema(createBlockKit());
  const mark = schema.marks.comment!.create({ threadId });
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, [schema.text("hello", [mark]), schema.text(" world")]),
  ]);
  return EditorState.create({ doc, schema });
}

function select(state: EditorState, from: number, to = from): EditorState {
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
}

test("comment mark carries threadId through a JSON round trip", () => {
  const schema = getSchema(createBlockKit());
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { id: null },
        content: [
          { type: "text", text: "hi", marks: [{ type: "comment", attrs: { threadId: "t1" } }] },
        ],
      },
    ],
  };

  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("comment marks with distinct threadIds can overlap the same range", () => {
  const schema = getSchema(createBlockKit());
  const a = schema.marks.comment!.create({ threadId: "a" });
  const b = schema.marks.comment!.create({ threadId: "b" });

  expect(a.type.excludes(b.type)).toBe(false);
  expect(b.type.excludes(a.type)).toBe(false);
});

test("activeThreadIds finds every distinct thread touching a range selection", () => {
  const withRange = select(stateWithComment("t1"), 1, 3);
  expect(activeThreadIds(withRange)).toEqual(["t1"]);
});

test("activeThreadIds is empty for a selection outside any comment", () => {
  const outside = select(stateWithComment("t1"), 8, 10);
  expect(activeThreadIds(outside)).toEqual([]);
});

test("activeThreadIds falls back to the cursor's marks at a collapsed selection", () => {
  const collapsed = select(stateWithComment("t1"), 3);
  expect(activeThreadIds(collapsed)).toEqual(["t1"]);
});

test("activeThreadIds is empty without a comment mark registered in the schema", () => {
  const schema = getSchema(createBlockKit({ comment: false }));
  const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("hi")])]);
  const state = EditorState.create({ doc, schema });

  expect(activeThreadIds(state)).toEqual([]);
});

test("comment ships with the kit by default and can be opted out", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("comment");
  expect(names({ comment: false })).not.toContain("comment");
});
