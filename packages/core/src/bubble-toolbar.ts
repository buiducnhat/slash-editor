import type { Editor } from "@tiptap/core";
import { Extension, isTextSelection, posToDOMRect } from "@tiptap/core";
import { canOpenLinkEditor } from "./link-editor.ts";

export interface BubbleToolbarItem {
  /** Stable identity for React keys. */
  id: string;
  label: string;
  /** Icon key resolved by the UI layer. */
  icon?: string;
  group?: string;
  shortcut?: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  when?: (editor: Editor) => boolean;
}

export interface BubbleToolbarState {
  open: boolean;
  /** Items visible for the current editor; already filtered by `when`. */
  items: BubbleToolbarItem[];
  /** Selection rectangle the toolbar anchors to; `null` while closed. */
  getClientRect: (() => DOMRect | null) | null;
}

export interface BubbleToolbarStorage {
  state: BubbleToolbarState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** Subscribes to toolbar state changes. Returns an unsubscribe function. */
  subscribe(this: BubbleToolbarStorage, listener: () => void): () => void;
  /** @internal Replaces state and notifies subscribers, skipping no-op closed transitions. */
  setState(this: BubbleToolbarStorage, next: BubbleToolbarState): void;
}

export interface BubbleToolbarOptions {
  items: BubbleToolbarItem[] | ((editor: Editor) => BubbleToolbarItem[]);
}

declare module "@tiptap/core" {
  interface Storage {
    bubbleToolbar: BubbleToolbarStorage;
  }
}

function hasMark(editor: Editor, name: string): boolean {
  return editor.schema.marks[name] !== undefined;
}

/**
 * Ranks are irrelevant here (there's no query to match against); this just
 * hides items the current schema or selection context can't run.
 */
export function filterBubbleToolbarItems(
  items: BubbleToolbarItem[],
  editor: Editor,
): BubbleToolbarItem[] {
  return items.filter((item) => item.when?.(editor) ?? true);
}

export const defaultBubbleToolbarItems: BubbleToolbarItem[] = [
  {
    id: "bold",
    label: "Bold",
    icon: "bold",
    shortcut: "⌘B",
    when: (editor) => hasMark(editor, "bold"),
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => {
      editor.chain().focus().toggleBold().run();
    },
  },
  {
    id: "italic",
    label: "Italic",
    icon: "italic",
    shortcut: "⌘I",
    when: (editor) => hasMark(editor, "italic"),
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => {
      editor.chain().focus().toggleItalic().run();
    },
  },
  {
    id: "strike",
    label: "Strikethrough",
    icon: "strikethrough",
    shortcut: "⌘⇧S",
    when: (editor) => hasMark(editor, "strike"),
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => {
      editor.chain().focus().toggleStrike().run();
    },
  },
  {
    id: "code",
    label: "Inline code",
    icon: "code",
    shortcut: "⌘E",
    when: (editor) => hasMark(editor, "code"),
    isActive: (editor) => editor.isActive("code"),
    run: (editor) => {
      editor.chain().focus().toggleCode().run();
    },
  },
  {
    id: "link",
    label: "Link",
    icon: "link",
    shortcut: "⌘K",
    when: (editor) => canOpenLinkEditor(editor),
    isActive: (editor) => editor.isActive("link"),
    run: (editor) => {
      editor.commands.openLinkEditor();
    },
  },
];

const CLOSED: BubbleToolbarState = Object.freeze({
  open: false,
  items: Object.freeze([]) as unknown as BubbleToolbarItem[],
  getClientRect: null,
});

/**
 * Computes toolbar visibility from the live selection: open only for a
 * non-empty text selection in a focused, editable view with at least one
 * runnable item. Node selections (e.g. a whole callout) never show it.
 */
function computeState(editor: Editor, options: BubbleToolbarOptions): BubbleToolbarState {
  const { view, state } = editor;
  const { selection, doc } = state;
  const { empty, from, to } = selection;

  if (
    !editor.isEditable ||
    !view.hasFocus() ||
    empty ||
    !isTextSelection(selection) ||
    !doc.textBetween(from, to).length
  ) {
    return CLOSED;
  }

  const registry = typeof options.items === "function" ? options.items(editor) : options.items;
  const items = filterBubbleToolbarItems(registry, editor);

  if (items.length === 0) {
    return CLOSED;
  }

  return {
    open: true,
    items,
    getClientRect: () => posToDOMRect(view, from, to),
  };
}

/**
 * Selection-anchored inline formatting toolbar. Unlike the slash menu, there
 * is no query to rank: core only decides *whether* the toolbar is visible
 * and *which* items apply, and the React layer renders it fully controlled
 * (`item.isActive`/`item.run` are called straight from the demo on click).
 */
export const BubbleToolbar = Extension.create<BubbleToolbarOptions, BubbleToolbarStorage>({
  name: "bubbleToolbar",

  addOptions() {
    return { items: defaultBubbleToolbarItems };
  },

  // Methods read and write through `this` because Tiptap hands each editor its
  // own storage object; closing over a local would update the wrong copy.
  addStorage() {
    return {
      state: CLOSED,
      listeners: new Set<() => void>(),

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },

      setState(next) {
        // Closed -> closed is never observable; skip the notification so
        // unrelated transactions elsewhere in the doc don't re-render a
        // toolbar nobody sees.
        if (!this.state.open && !next.open) {
          return;
        }
        this.state = next;
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  onTransaction() {
    this.storage.setState(computeState(this.editor, this.options));
  },

  onFocus() {
    this.storage.setState(computeState(this.editor, this.options));
  },

  onBlur() {
    this.storage.setState(CLOSED);
  },
});

/** Configures the bubble toolbar extension. */
export function bubbleToolbar(options: Partial<BubbleToolbarOptions> = {}) {
  return BubbleToolbar.configure(options);
}
