import type { Editor } from "@tiptap/core";
import { Extension, posToDOMRect } from "@tiptap/core";

export interface LinkEditorState {
  open: boolean;
  /** Draft href shown in the popover input. */
  href: string;
  /** `true` when editing a link already on the selection; `false` when drafting one over new text. */
  editing: boolean;
  /** Selection rectangle the popover anchors to; `null` while closed. */
  getClientRect: (() => DOMRect | null) | null;
}

export interface LinkEditorStorage {
  state: LinkEditorState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** Subscribes to popover state changes. Returns an unsubscribe function. */
  subscribe(this: LinkEditorStorage, listener: () => void): () => void;
  /** @internal Replaces state and notifies subscribers, skipping no-op closed transitions. */
  setState(this: LinkEditorStorage, next: LinkEditorState): void;
}

export interface LinkEditorOptions {
  /** Opens automatically when the selection lands inside an existing link. @default true */
  autoOpenOnLinkActive: boolean;
}

declare module "@tiptap/core" {
  interface Storage {
    linkEditor: LinkEditorStorage;
  }
  interface Commands<ReturnType> {
    linkEditor: {
      /** Opens the popover: prefilled with the active link's href, or empty over a fresh text selection. */
      openLinkEditor: () => ReturnType;
      /** Updates the draft href. Local UI state only — it never touches the document. */
      setLinkEditorHref: (href: string) => ReturnType;
      /** Closes without applying, refocusing the document. */
      closeLinkEditor: () => ReturnType;
    };
  }
}

function hasLinkMark(editor: Editor): boolean {
  return editor.schema.marks.link !== undefined;
}

/** Whether a link can be created (non-empty text selection) or edited (cursor inside one) right now. */
export function canOpenLinkEditor(editor: Editor): boolean {
  if (!hasLinkMark(editor) || !editor.isEditable) {
    return false;
  }
  const { from, to, empty } = editor.state.selection;
  return editor.isActive("link") || (!empty && editor.state.doc.textBetween(from, to).length > 0);
}

const CLOSED: LinkEditorState = Object.freeze({
  open: false,
  href: "",
  editing: false,
  getClientRect: null,
});

function computeAutoState(editor: Editor): LinkEditorState {
  // No `hasFocus()` gate here (unlike `BubbleToolbar`'s `computeState`):
  // `enableClickSelection`'s `extendMarkRange` dispatch runs from the
  // click's own `handleClick` plugin prop, before the browser has finished
  // settling DOM focus from that same click — `hasFocus()` can read `false`
  // on this exact transaction. Nothing here needs it anyway: there is no
  // `onBlur` closer to keep in sync with, by design (see the class doc).
  if (!editor.isEditable || !editor.isActive("link")) {
    return CLOSED;
  }
  const { from, to } = editor.state.selection;
  return {
    open: true,
    href: (editor.getAttributes("link").href as string | undefined) ?? "",
    editing: true,
    getClientRect: () => posToDOMRect(editor.view, from, to),
  };
}

/**
 * Selection-anchored link editing popover. Two entry points feed the same
 * state: a bubble-toolbar "Link" button calls `openLinkEditor` over a fresh
 * text selection (`editing: false`), and this extension auto-opens itself
 * (`editing: true`) whenever the cursor lands inside an existing link — a
 * case a plain "selection is non-empty" check (à la `BubbleToolbar`) can't
 * catch, since placing a cursor inside a link selects no text.
 *
 * Applying or removing the link itself is not a custom command here: once
 * open, a UI layer calls the `link` mark's own `setLink`/`unsetLink` (from
 * `@tiptap/extension-link`) directly, the same way `BubbleToolbarItem.run`
 * calls `toggleBold` directly — this extension only owns popover
 * visibility and the draft href.
 *
 * The popover is never closed by `onTransaction`/`onBlur` alone once open:
 * its own input needs real DOM focus to type a URL, and a blur there must
 * not read as "dismiss". Only an explicit command (`closeLinkEditor`, or a
 * document selection change while `editing`) closes it.
 */
export const LinkEditor = Extension.create<LinkEditorOptions, LinkEditorStorage>({
  name: "linkEditor",

  addOptions() {
    return { autoOpenOnLinkActive: true };
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
        // popover nobody sees.
        if (!this.state.open && !next.open) {
          return;
        }
        this.state = next;
        this.listeners.forEach((listener) => listener());
      },
    };
  },

  addCommands() {
    return {
      openLinkEditor:
        () =>
        ({ editor }) => {
          if (!canOpenLinkEditor(editor)) {
            return false;
          }
          const { from, to } = editor.state.selection;
          editor.storage.linkEditor.setState({
            open: true,
            href: (editor.getAttributes("link").href as string | undefined) ?? "",
            editing: editor.isActive("link"),
            getClientRect: () => posToDOMRect(editor.view, from, to),
          });
          return true;
        },
      setLinkEditorHref:
        (href: string) =>
        ({ editor }) => {
          if (!editor.storage.linkEditor.state.open) {
            return false;
          }
          editor.storage.linkEditor.setState({ ...editor.storage.linkEditor.state, href });
          return true;
        },
      closeLinkEditor:
        () =>
        ({ editor }) => {
          // `editor.view.focus()`, not `editor.commands.focus()`: the
          // latter runs its own full command dispatch, and calling it from
          // inside this command's body nests one dispatch cycle inside
          // another. That nesting has silently aborted this command before
          // reaching `setState` below, leaving the popover stuck open —
          // plain DOM focus carries no transaction, so it can't collide.
          editor.view.focus();
          editor.storage.linkEditor.setState(CLOSED);
          return true;
        },
    };
  },

  onTransaction() {
    // A draft over freshly selected text has no schema signal of its own
    // (`isActive("link")` is false until it's applied); freeze it so an
    // unrelated transaction can't recompute it closed while the user is
    // still typing a URL in the popover's own input.
    if (this.storage.state.open && !this.storage.state.editing) {
      return;
    }
    if (!this.options.autoOpenOnLinkActive) {
      if (this.storage.state.open) {
        this.storage.setState(CLOSED);
      }
      return;
    }
    this.storage.setState(computeAutoState(this.editor));
  },
});

/** Configures the link editor extension. */
export function linkEditor(options: Partial<LinkEditorOptions> = {}) {
  return LinkEditor.configure(options);
}
