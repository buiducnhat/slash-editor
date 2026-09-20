import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection, type Transaction } from "@tiptap/pm/state";
import { expect, test } from "vite-plus/test";
import {
  type BlockRect,
  BlockDrag,
  canAppendChild,
  createBlockKit,
  resolveDropTarget,
} from "../src/index.ts";

function rect(
  pos: number,
  size: number,
  type: string,
  top: number,
  bottom: number,
  container: { type?: string; pos?: number; size?: number } = {},
): BlockRect {
  return {
    pos,
    size,
    type,
    left: 0,
    right: 100,
    top,
    bottom,
    parentType: container.type ?? "doc",
    containerPos: container.pos ?? pos,
    containerSize: container.size ?? size,
  };
}

test("a candidate above the pointer's midpoint drops before it", () => {
  const source = rect(0, 5, "paragraph", 0, 20);
  const target = rect(5, 5, "paragraph", 20, 40);

  expect(
    resolveDropTarget([source, target], { x: 0, y: 22 }, source, {
      indentThreshold: 32,
      canNest: () => false,
      canPlaceBeside: () => true,
    }),
  ).toMatchObject({ pos: 5, mode: "before" });
});

test("a candidate below the pointer's midpoint drops after it", () => {
  const source = rect(0, 5, "paragraph", 0, 20);
  const target = rect(5, 5, "paragraph", 20, 40);

  expect(
    resolveDropTarget([source, target], { x: 0, y: 38 }, source, {
      indentThreshold: 32,
      canNest: () => false,
      canPlaceBeside: () => true,
    }),
  ).toMatchObject({ pos: 10, mode: "after" });
});

test("dragging the only block in the document resolves no drop target", () => {
  const source = rect(0, 5, "paragraph", 0, 20);

  expect(
    resolveDropTarget([source], { x: 0, y: 10 }, source, {
      indentThreshold: 32,
      canNest: () => false,
      canPlaceBeside: () => true,
    }),
  ).toBeNull();
});

test("rightward travel past the threshold nests, when the schema allows it", () => {
  const source = rect(10, 5, "paragraph", 20, 40);
  const target = rect(0, 8, "listItem", 0, 20);

  const result = resolveDropTarget([source, target], { x: 40, y: 10 }, source, {
    indentThreshold: 32,
    canNest: (_source: BlockRect, target: BlockRect) => target.type === "listItem",
    canPlaceBeside: () => true,
  });

  expect(result).toMatchObject({ pos: 7, mode: "inside" });
});

test("nesting degrades to before/after when the schema forbids it", () => {
  const source = rect(10, 5, "paragraph", 20, 40);
  const target = rect(0, 8, "codeBlock", 0, 20);

  const result = resolveDropTarget([source, target], { x: 40, y: 5 }, source, {
    indentThreshold: 32,
    canNest: () => false,
    canPlaceBeside: () => true,
  });

  expect(result).toMatchObject({ pos: 0, mode: "before" });
});

test("travel under the threshold never nests even when the schema allows it", () => {
  const source = rect(10, 5, "paragraph", 20, 40);
  const target = rect(0, 8, "listItem", 0, 20);

  const result = resolveDropTarget([source, target], { x: 15, y: 5 }, source, {
    indentThreshold: 32,
    canNest: () => true,
    canPlaceBeside: () => true,
  });

  expect(result).toMatchObject({ pos: 0, mode: "before" });
});

test("a source that can't sit beside a list item lands before the whole list instead", () => {
  const source = rect(30, 5, "codeBlock", 40, 60);
  const target = rect(5, 8, "listItem", 0, 20, { type: "bulletList", pos: 0, size: 20 });

  const result = resolveDropTarget([source, target], { x: 5, y: 5 }, source, {
    indentThreshold: 32,
    canNest: () => false,
    // A codeBlock cannot be a sibling of a listItem inside a bulletList.
    canPlaceBeside: () => false,
  });

  expect(result).toMatchObject({ pos: 0, mode: "before" });
});

test("a source that can't sit beside a list item lands after the whole list instead", () => {
  const source = rect(30, 5, "codeBlock", 40, 60);
  const target = rect(5, 8, "listItem", 0, 20, { type: "bulletList", pos: 0, size: 20 });

  const result = resolveDropTarget([source, target], { x: 5, y: 15 }, source, {
    indentThreshold: 32,
    canNest: () => false,
    canPlaceBeside: () => false,
  });

  expect(result).toMatchObject({ pos: 20, mode: "after" });
});

interface CommandContext {
  tr: Transaction;
  state: EditorState;
  dispatch: (tr: Transaction) => void;
}

function commands() {
  return BlockDrag.config.addCommands!.call({} as never) as {
    moveBlock: (options: {
      from: number;
      size: number;
      to: number;
    }) => (ctx: CommandContext) => boolean;
    moveBlockUp: () => (ctx: CommandContext) => boolean;
    moveBlockDown: () => (ctx: CommandContext) => boolean;
    duplicateBlock: (options: { pos: number; size: number }) => (ctx: CommandContext) => boolean;
    deleteBlock: (options: { pos: number; size: number }) => (ctx: CommandContext) => boolean;
  };
}

function run(
  state: EditorState,
  command: (ctx: CommandContext) => boolean,
): { applied: boolean; state: EditorState } {
  const tr = state.tr;
  const applied = command({ tr, state, dispatch: () => {} });

  return { applied, state: applied ? state.apply(tr) : state };
}

function threeParagraphState(): EditorState {
  const schema = getSchema(createBlockKit());
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: ["A", "B", "C"].map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  });

  return EditorState.create({ doc });
}

function textsOf(state: EditorState): string[] {
  return state.doc.content.content.map((node) => node.textContent);
}

test("moveBlockUp swaps the selected block with its previous sibling", () => {
  let state = threeParagraphState();
  state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(4))));

  const { applied, state: next } = run(state, commands().moveBlockUp());

  expect(applied).toBe(true);
  expect(textsOf(next)).toEqual(["B", "A", "C"]);
});

test("moveBlockDown swaps the selected block with its next sibling", () => {
  let state = threeParagraphState();
  state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(4))));

  const { applied, state: next } = run(state, commands().moveBlockDown());

  expect(applied).toBe(true);
  expect(textsOf(next)).toEqual(["A", "C", "B"]);
});

test("moveBlockUp on the first block is a no-op", () => {
  const state = threeParagraphState();

  const { applied } = run(state, commands().moveBlockUp());

  expect(applied).toBe(false);
});

test("moveBlockDown on the last block is a no-op", () => {
  let state = threeParagraphState();
  state = state.apply(
    state.tr.setSelection(TextSelection.near(state.doc.resolve(state.doc.content.size - 1))),
  );

  const { applied } = run(state, commands().moveBlockDown());

  expect(applied).toBe(false);
});

test("moveBlock reorders across a distance in one transaction", () => {
  const state = threeParagraphState();

  const { applied, state: next } = run(
    state,
    commands().moveBlock({
      from: 0,
      size: state.doc.child(0).nodeSize,
      to: state.doc.content.size,
    }),
  );

  expect(applied).toBe(true);
  expect(textsOf(next)).toEqual(["B", "C", "A"]);
});

test("moveBlock nests a paragraph inside a list item", () => {
  const schema = getSchema(createBlockKit());
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }],
          },
        ],
      },
      { type: "paragraph", content: [{ type: "text", text: "loose" }] },
    ],
  });
  const state = EditorState.create({ doc });

  let listItemPos = -1;
  let looseFrom = -1;
  doc.descendants((node, pos) => {
    if (node.type.name === "listItem") {
      listItemPos = pos;
    }
    if (node.type.name === "paragraph" && node.textContent === "loose") {
      looseFrom = pos;
    }
  });
  const listItem = doc.nodeAt(listItemPos)!;
  const loose = doc.nodeAt(looseFrom)!;
  const listItemEnd = listItemPos + listItem.nodeSize - 1;

  const { applied, state: next } = run(
    state,
    commands().moveBlock({ from: looseFrom, size: loose.nodeSize, to: listItemEnd }),
  );

  expect(applied).toBe(true);
  expect(next.doc.content.content).toHaveLength(1);
  const nestedListItem = next.doc.firstChild!.firstChild!;
  expect(nestedListItem.childCount).toBe(2);
  expect(nestedListItem.child(1).textContent).toBe("loose");
});

test("canAppendChild allows a block after a list item's required first paragraph", () => {
  const schema = getSchema(createBlockKit());
  const listItem = schema.nodeFromJSON({
    type: "listItem",
    content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }],
  });

  // listItem's content is "paragraph block*": a codeBlock cannot open it,
  // but can follow the required paragraph — the append position, not the start.
  expect(canAppendChild(listItem, schema.nodes.codeBlock)).toBe(true);
  expect(listItem.contentMatchAt(0).matchType(schema.nodes.codeBlock)).toBeNull();
});

test("duplicateBlock inserts a copy right after the original", () => {
  const state = threeParagraphState();

  const { applied, state: next } = run(
    state,
    commands().duplicateBlock({ pos: 0, size: state.doc.child(0).nodeSize }),
  );

  expect(applied).toBe(true);
  expect(textsOf(next)).toEqual(["A", "A", "B", "C"]);
});

test("duplicateBlock is a no-op when pos/size no longer match a node", () => {
  const state = threeParagraphState();

  const { applied } = run(state, commands().duplicateBlock({ pos: 0, size: 99 }));

  expect(applied).toBe(false);
});

test("deleteBlock removes the node at pos/size", () => {
  const state = threeParagraphState();

  const { applied, state: next } = run(
    state,
    commands().deleteBlock({ pos: 3, size: state.doc.child(1).nodeSize }),
  );

  expect(applied).toBe(true);
  expect(textsOf(next)).toEqual(["A", "C"]);
});

test("deleteBlock is a no-op when pos/size no longer match a node", () => {
  const state = threeParagraphState();

  const { applied } = run(state, commands().deleteBlock({ pos: 3, size: 99 }));

  expect(applied).toBe(false);
});
