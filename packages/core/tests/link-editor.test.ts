import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { expect, test } from "vite-plus/test";
import {
  canOpenLinkEditor,
  createBlockKit,
  linkEditor,
  type LinkEditorOptions,
} from "../src/index.ts";

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

/**
 * A real, unmounted editor: no DOM, so a key press is fed straight to the
 * plugins' `handleKeyDown` props in registration order, the way
 * `EditorView` would. `Mod` follows ProseMirror's own platform check.
 */
function pressModK(options: Partial<LinkEditorOptions>, select: { from: number; to: number }) {
  const editor = new Editor({
    element: null,
    extensions: [StarterKit, linkEditor(options)],
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hello world" }] }],
    },
  });
  editor.commands.setTextSelection(select);

  const mac = typeof navigator !== "undefined" && /Mac|iP(hone|[oa]d)/.test(navigator.platform);
  const event = {
    key: "k",
    keyCode: 75,
    metaKey: mac,
    ctrlKey: !mac,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent;
  const view = { state: editor.state, dispatch: () => {} };
  const handled = editor.extensionManager.plugins.some(
    (plugin) => plugin.props.handleKeyDown?.call(plugin, view as never, event) === true,
  );
  const { open, editing } = editor.storage.linkEditor.state;
  editor.destroy();
  return { handled, open, editing };
}

test("Mod-k opens the link editor over a text selection", () => {
  expect(pressModK({}, { from: 1, to: 6 })).toEqual({ handled: true, open: true, editing: false });
});

test("Mod-k falls through when there is nothing to link", () => {
  expect(pressModK({}, { from: 3, to: 3 })).toEqual({
    handled: false,
    open: false,
    editing: false,
  });
});

test("shortcut: false unbinds the key", () => {
  expect(pressModK({ shortcut: false }, { from: 1, to: 6 })).toEqual({
    handled: false,
    open: false,
    editing: false,
  });
});
