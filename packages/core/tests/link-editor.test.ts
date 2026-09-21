import type { Editor } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { canOpenLinkEditor, createBlockKit } from "../src/index.ts";

/** Only the schema, editability, active marks, and selection are read by `canOpenLinkEditor`. */
function editorWith(options: {
  marks?: string[];
  isEditable?: boolean;
  active?: string[];
  selectedText?: string;
  empty?: boolean;
}): Editor {
  const marks = options.marks ?? ["link"];
  const empty = options.empty ?? true;
  const text = options.selectedText ?? "";

  return {
    schema: { marks: Object.fromEntries(marks.map((name) => [name, {}])) },
    isEditable: options.isEditable ?? true,
    isActive: (name: string) => (options.active ?? []).includes(name),
    state: {
      selection: { from: 0, to: text.length, empty },
      doc: { textBetween: () => text },
    },
  } as unknown as Editor;
}

test("canOpenLinkEditor requires the link mark and an editable view", () => {
  expect(canOpenLinkEditor(editorWith({ marks: [] }))).toBe(false);
  expect(canOpenLinkEditor(editorWith({ isEditable: false }))).toBe(false);
});

test("canOpenLinkEditor is true only over a non-empty text selection", () => {
  expect(canOpenLinkEditor(editorWith({ empty: true }))).toBe(false);
  expect(canOpenLinkEditor(editorWith({ empty: false, selectedText: "hello" }))).toBe(true);
});

test("canOpenLinkEditor is true with a collapsed cursor already inside a link", () => {
  expect(canOpenLinkEditor(editorWith({ empty: true, active: ["link"] }))).toBe(true);
});

test("linkEditor ships with the kit, opts out, and configures autoOpenOnLinkActive", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).toContain("linkEditor");
  expect(names({ linkEditor: false })).not.toContain("linkEditor");

  const linkEditor = createBlockKit({ linkEditor: { autoOpenOnLinkActive: false } }).find(
    (extension) => extension.name === "linkEditor",
  );
  expect(linkEditor?.options.autoOpenOnLinkActive).toBe(false);
});

test("the baseline kit configures the link mark for editing rather than click-through navigation", () => {
  const [starterKit] = createBlockKit();
  expect(starterKit.options.link).toMatchObject({ openOnClick: false, enableClickSelection: true });
});
