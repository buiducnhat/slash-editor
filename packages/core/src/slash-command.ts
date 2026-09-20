import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion, type SuggestionProps } from "@tiptap/suggestion";
import { defaultSlashItems, filterSlashItems, type SlashItem } from "./slash-items.ts";

export interface SlashMenuState {
  open: boolean;
  /** Text typed after the trigger character. */
  query: string;
  /** Ranked items for the current query. */
  items: SlashItem[];
  /** Index of the keyboard-highlighted item; `-1` when there are no items. */
  activeIndex: number;
  /** Caret rectangle the menu anchors to; `null` while closed. */
  getClientRect: (() => DOMRect | null) | null;
}

export interface SlashCommandStorage {
  state: SlashMenuState;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** @internal Live suggestion handle; `null` while the menu is closed. */
  active: SuggestionProps<SlashItem, SlashItem> | null;
  /** Subscribes to menu state changes. Returns an unsubscribe function. */
  subscribe(this: SlashCommandStorage, listener: () => void): () => void;
  /** Moves the keyboard highlight; the index wraps around the item list. */
  setActiveIndex(this: SlashCommandStorage, index: number): void;
  /** Runs an item, defaulting to the highlighted one. */
  select(this: SlashCommandStorage, index?: number): void;
  /** Closes the menu and leaves the typed text in the document. */
  close(this: SlashCommandStorage): void;
  /** @internal Called by the suggestion plugin on start/update/exit. */
  setActive(this: SlashCommandStorage, props: SuggestionProps<SlashItem, SlashItem> | null): void;
}

export interface SlashCommandOptions {
  /** Trigger character. */
  char: string;
  /** Item registry, or a resolver called with the live editor. */
  items: SlashItem[] | ((editor: Editor) => SlashItem[]);
  /**
   * Called when an item's `run` throws. The failing transaction is never
   * applied, so the document keeps the state it had before the item ran.
   */
  onError?: (error: unknown, context: { item: SlashItem; editor: Editor }) => void;
}

declare module "@tiptap/core" {
  interface Storage {
    slashCommand: SlashCommandStorage;
  }
}

export const slashCommandPluginKey = new PluginKey("slashCommand");

const CLOSED: SlashMenuState = Object.freeze({
  open: false,
  query: "",
  items: Object.freeze([]) as unknown as SlashItem[],
  activeIndex: -1,
  getClientRect: null,
});

export const SlashCommand = Extension.create<SlashCommandOptions, SlashCommandStorage>({
  name: "slashCommand",

  addOptions() {
    return {
      char: "/",
      items: defaultSlashItems,
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
    const getStorage = () => editor.storage.slashCommand;
    const { onError } = this.options;
    const resolveItems = () =>
      typeof this.options.items === "function" ? this.options.items(editor) : this.options.items;

    return [
      Suggestion<SlashItem, SlashItem>({
        editor,
        char: this.options.char,
        pluginKey: slashCommandPluginKey,
        allowSpaces: false,
        // Code blocks take their text literally; a slash there is just a slash.
        allow: ({ state, range }) => !state.doc.resolve(range.from).parent.type.spec.code,
        items: ({ query }) => filterSlashItems(resolveItems(), query, editor),
        command: ({ editor: instance, range, props: item }) => {
          try {
            item.run({ editor: instance, range });
          } catch (error) {
            if (onError) {
              onError(error, { item, editor: instance });
            } else {
              throw error;
            }
          }
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

/** Configures the slash menu extension. */
export function slashCommand(options: Partial<SlashCommandOptions> = {}) {
  return SlashCommand.configure(options);
}
