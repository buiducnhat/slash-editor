import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion, type SuggestionProps } from "@tiptap/suggestion";

export interface MentionItem {
  /** Stable identity of the mentioned entity (user id, page id, …). */
  id: string;
  /** Rendered label, e.g. a display name. */
  label: string;
  /** One-line hint rendered next to the label (e.g. an email or handle). */
  description?: string;
  /** Icon key resolved by the UI layer; the core ships no components. */
  icon?: string;
}

export interface MentionState {
  open: boolean;
  /** Text typed after the trigger character. */
  query: string;
  /** Items returned by the provider for the current query. */
  items: MentionItem[];
  /** Index of the keyboard-highlighted item; `-1` when there are no items. */
  activeIndex: number;
  /** `true` while the provider's promise for the current query is in flight. */
  loading: boolean;
  /** Caret rectangle the menu anchors to; `null` while closed. */
  getClientRect: (() => DOMRect | null) | null;
}

export interface MentionStorage {
  state: MentionState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** @internal Live suggestion handle; `null` while the menu is closed. */
  active: SuggestionProps<MentionItem, MentionItem> | null;
  /** Subscribes to menu state changes. Returns an unsubscribe function. */
  subscribe(this: MentionStorage, listener: () => void): () => void;
  /** Moves the keyboard highlight; the index wraps around the item list. */
  setActiveIndex(this: MentionStorage, index: number): void;
  /** Runs an item, defaulting to the highlighted one. */
  select(this: MentionStorage, index?: number): void;
  /** Closes the menu and leaves the typed text in the document. */
  close(this: MentionStorage): void;
  /** @internal Called by the suggestion plugin on start/update/exit. */
  setActive(this: MentionStorage, props: SuggestionProps<MentionItem, MentionItem> | null): void;
}

export interface MentionOptions {
  /** Trigger character. @default "@" */
  char: string;
  /**
   * Async provider, called for every query with the current query text and
   * an `AbortSignal` for the in-flight request. `@tiptap/suggestion` aborts
   * a call itself as soon as a newer keystroke supersedes it.
   */
  items: (
    query: string,
    context: { editor: Editor; signal: AbortSignal },
  ) => MentionItem[] | Promise<MentionItem[]>;
  /** Debounce, in ms, before `items` runs after the user stops typing. @default 150 */
  debounce: number;
  /** Minimum query length before `items` runs. @default 0 */
  minQueryLength: number;
  HTMLAttributes: Record<string, unknown>;
  /**
   * Called when `items` rejects. The menu shows an empty result set either
   * way, so a mention query never gets stuck loading forever.
   */
  onError?: (error: unknown, context: { editor: Editor }) => void;
}

declare module "@tiptap/core" {
  interface Storage {
    mention: MentionStorage;
  }
  interface Commands<ReturnType> {
    mention: {
      /** Inserts a mention node for `item` at the current selection. */
      insertMention: (item: MentionItem) => ReturnType;
    };
  }
}

export const mentionPluginKey = new PluginKey("mention");

const CLOSED: MentionState = Object.freeze({
  open: false,
  query: "",
  items: Object.freeze([]) as unknown as MentionItem[],
  activeIndex: -1,
  loading: false,
  getClientRect: null,
});

/**
 * `@`-mention node backed by an async, bring-your-own provider. Mirrors
 * `SlashCommand`'s architecture (a `Suggestion` plugin, per-editor storage
 * with a `subscribe`/state-machine shape) with one addition: `items` may
 * return a `Promise`, so `state.loading` reflects an in-flight request the
 * slash menu never has to model.
 */
export const Mention = Node.create<MentionOptions, MentionStorage>({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      char: "@",
      items: () => [],
      debounce: 150,
      minQueryLength: 0,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
      },
      label: {
        default: null,
        parseHTML: (element) => element.textContent?.replace(/^@/, "") ?? null,
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[data-type="${this.name}"]` }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        "data-id": node.attrs.id,
      }),
      `@${node.attrs.label}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.label}`;
  },

  addCommands() {
    return {
      insertMention:
        (item: MentionItem) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { id: item.id, label: item.label } })
            .insertContent(" ")
            .run(),
    };
  },

  // Methods read and write through `this` because Tiptap hands each editor its
  // own storage object; closing over a local would update the wrong copy.
  addStorage() {
    return {
      state: CLOSED,
      listeners: new Set<() => void>(),
      active: null,

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },

      setActive(props) {
        this.active = props;

        if (!props) {
          if (this.state !== CLOSED) {
            this.state = CLOSED;
            this.listeners.forEach((listener) => listener());
          }
          return;
        }

        const sameItems =
          this.state.items.length === props.items.length &&
          this.state.items.every((item, index) => item === props.items[index]);

        this.state = {
          open: true,
          query: props.query,
          items: props.items,
          // Unchanged results keep the highlight where the user left it.
          activeIndex: props.items.length === 0 ? -1 : sameItems ? this.state.activeIndex : 0,
          loading: props.loading,
          getClientRect: props.clientRect ?? null,
        };
        this.listeners.forEach((listener) => listener());
      },

      setActiveIndex(index) {
        const { items } = this.state;

        if (!this.state.open || items.length === 0) {
          return;
        }

        const wrapped = ((index % items.length) + items.length) % items.length;

        if (wrapped !== this.state.activeIndex) {
          this.state = { ...this.state, activeIndex: wrapped };
          this.listeners.forEach((listener) => listener());
        }
      },

      select(index) {
        const item = this.state.items[index ?? this.state.activeIndex];

        if (this.active && item) {
          this.active.command(item);
        }
      },

      close() {
        this.active?.editor.commands.focus();
        this.setActive(null);
      },
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    // Resolved lazily: the extension manager wires storage after plugins.
    const getStorage = () => editor.storage.mention;
    const { onError } = this.options;

    return [
      Suggestion<MentionItem, MentionItem>({
        editor,
        char: this.options.char,
        pluginKey: mentionPluginKey,
        allowSpaces: false,
        debounce: this.options.debounce,
        minQueryLength: this.options.minQueryLength,
        items: async ({ query, signal }) => {
          try {
            return await this.options.items(query, { editor, signal });
          } catch (error) {
            if (signal.aborted) {
              return [];
            }
            onError?.(error, { editor });
            return [];
          }
        },
        command: ({ editor: instance, range, props: item }) => {
          instance
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: "mention", attrs: { id: item.id, label: item.label } },
              { type: "text", text: " " },
            ])
            .run();
        },
        render: () => ({
          onStart: (props) => getStorage().setActive(props),
          onUpdate: (props) => getStorage().setActive(props),
          onExit: () => getStorage().setActive(null),
          onKeyDown: ({ event }) => {
            const storage = getStorage();

            if (!storage.state.open) {
              return false;
            }

            switch (event.key) {
              case "ArrowDown":
                storage.setActiveIndex(storage.state.activeIndex + 1);
                return true;
              case "ArrowUp":
                storage.setActiveIndex(storage.state.activeIndex - 1);
                return true;
              case "Enter":
              case "Tab":
                if (storage.state.items.length === 0) {
                  return false;
                }
                storage.select();
                return true;
              default:
                return false;
            }
          },
        }),
      }),
    ];
  },
});

/** Configures the mention node. `items` is required — there is no default provider. */
export function mention(options: Partial<MentionOptions> & Pick<MentionOptions, "items">) {
  return Mention.configure(options);
}
