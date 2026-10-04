import { getSchema } from "@tiptap/core";
import { history, undo } from "@tiptap/pm/history";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { expect, test } from "vite-plus/test";
import { activeThreadIds, createBlockKit, removeCommentThread } from "../src/index.ts";

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

// Text runs with their sorted thread ids — mark order within a run is not significant.
function anchors(doc: EditorState["doc"]): [string, string[]][] {
  const runs: [string, string[]][] = [];
  doc.descendants((node) => {
    if (!node.isText) return;
    const ids = node.marks.map((mark) => mark.attrs.threadId as string).sort();
    runs.push([node.text!, ids]);
  });
  return runs;
}

test("removeCommentThread strips every anchor of one thread, wherever the selection is", () => {
  const schema = getSchema(createBlockKit());
  const t1 = schema.marks.comment!.create({ threadId: "t1" });
  const t2 = schema.marks.comment!.create({ threadId: "t2" });
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, [schema.text("alpha", [t1]), schema.text(" one")]),
    schema.node("paragraph", null, [
      schema.text("be", [t1]),
      schema.text("ta", [t1, t2]),
      schema.text(" two", [t2]),
    ]),
    schema.node("paragraph", null, [schema.text("elsewhere")]),
  ]);
  const before = EditorState.create({ doc, schema, plugins: [history()] });
  const state = select(before, before.doc.content.size - 3);

  const after = state.apply(removeCommentThread(state.tr, schema.marks.comment!, "t1"));
  expect(anchors(after.doc)).toEqual([
    ["alpha one", []],
    ["be", []],
    ["ta two", ["t2"]],
    ["elsewhere", []],
  ]);
  expect(activeThreadIds(select(after, 13, 19))).toEqual(["t2"]);

  let undone = after;
  expect(undo(after, (tr) => (undone = after.apply(tr)))).toBe(true);
  expect(anchors(undone.doc)).toEqual(anchors(doc));
});
