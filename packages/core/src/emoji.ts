import type { Editor, JSONContent, MarkdownParseHelpers, MarkdownToken } from "@tiptap/core";
import {
  Emoji as TiptapEmoji,
  emojis as defaultEmojis,
  shortcodeToEmoji,
  type EmojiItem,
  type EmojiOptions as TiptapEmojiOptions,
  type EmojiStorage as TiptapEmojiStorage,
} from "@tiptap/extension-emoji";
import type { SuggestionProps } from "@tiptap/suggestion";

export type { EmojiItem } from "@tiptap/extension-emoji";

export interface EmojiMenuState {
  open: boolean;
  /** Text typed after the `:` trigger. */
  query: string;
  /** Matching emojis for the current query, best match first. */
  items: EmojiItem[];
  /** Index of the keyboard-highlighted item; `-1` when there are no items. */
  activeIndex: number;
  /** Caret rectangle the menu anchors to; `null` while closed. */
  getClientRect: (() => DOMRect | null) | null;
}

export interface EmojiMenuStorage extends TiptapEmojiStorage {
  state: EmojiMenuState;
  /** @internal Result cap read by the suggestion's `items`. */
  limit: number;
  /** @internal Subscribers notified after every state change. */
  listeners: Set<() => void>;
  /** @internal Live suggestion handle; `null` while the menu is closed. */
  active: SuggestionProps<EmojiItem, EmojiItem> | null;
  /** Subscribes to menu state changes. Returns an unsubscribe function. */
  subscribe(this: EmojiMenuStorage, listener: () => void): () => void;
  /** Moves the keyboard highlight; the index wraps around the item list. */
  setActiveIndex(this: EmojiMenuStorage, index: number): void;
  /** Inserts an emoji, defaulting to the highlighted one. */
  select(this: EmojiMenuStorage, index?: number): void;
  /** Closes the menu and leaves the typed text in the document. */
  close(this: EmojiMenuStorage): void;
  /** @internal Called by the suggestion plugin on start/update/exit. */
  setActive(this: EmojiMenuStorage, props: SuggestionProps<EmojiItem, EmojiItem> | null): void;
}

export interface EmojiOptions extends TiptapEmojiOptions {
  /** Maximum number of emojis the picker lists for a query. @default 24 */
  limit: number;
}

const CLOSED: EmojiMenuState = Object.freeze({
  open: false,
  query: "",
  items: Object.freeze([]) as unknown as EmojiItem[],
  activeIndex: -1,
  getClientRect: null,
});

const SHORTCODE = /^:([a-zA-Z0-9_+-]+):/;

const NAME_PREFIX = 100;
const SHORTCODE_PREFIX = 80;
const NAME_SUBSTRING = 40;
const TAG_MATCH = 20;

function score(item: EmojiItem, query: string): number {
  const name = item.name.toLowerCase();

  if (name.startsWith(query)) return NAME_PREFIX;
  if (item.shortcodes.some((code) => code.toLowerCase().startsWith(query))) return SHORTCODE_PREFIX;
  if (name.includes(query) || item.shortcodes.some((code) => code.toLowerCase().includes(query))) {
    return NAME_SUBSTRING;
  }
  if (item.tags.some((tag) => tag.toLowerCase().startsWith(query))) return TAG_MATCH;
  return 0;
}

/**
 * Ranks emojis against a `:shortcode:` query: name prefix, then shortcode
 * prefix, then substring, then tag. Ties keep dataset order. An empty query
 * lists the first `limit` emojis of the dataset, regional-indicator letters
 * excluded.
 */
export function searchEmojis(emojis: EmojiItem[], query: string, limit: number): EmojiItem[] {
  const normalized = query.trim().toLowerCase();

  // Letters without a glyph of their own (`regional_indicator_a`) are for
  // building flags, not picking.
  const pickable = emojis.filter((item) => item.emoji || item.fallbackImage);

  if (!normalized) {
    return pickable.slice(0, limit);
  }

  return pickable
    .map((item) => ({ item, score: score(item, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

/**
 * Emoji node with a `:`-triggered picker. Wraps Tiptap's `Emoji` — its
 * dataset, `:shortcode:` input/paste rules, and unicode-to-node conversion —
 * and gives the suggestion the same per-editor `subscribe`/state shape
 * `Mention` has, so a UI layer renders the menu without any DOM here.
 *
 * Markdown is `:shortcode:` (what GitHub renders as the glyph); an unknown
 * shortcode stays plain text.
 */
export const Emoji = TiptapEmoji.extend<EmojiOptions, EmojiMenuStorage>({
  addOptions() {
    const parent = this.parent?.() as TiptapEmojiOptions;

    return {
      ...parent,
      limit: 24,
      suggestion: {
        ...parent.suggestion,
        items: ({ editor, query }: { editor: Editor; query: string }) => {
          const { emojis, limit } = editor.storage.emoji as EmojiMenuStorage;
          return searchEmojis(emojis, query, limit);
        },
        render: () => {
          // `onKeyDown` receives no editor, so the live one is kept from `onStart`.
          let storage: EmojiMenuStorage | null = null;

          return {
            onStart: (props: SuggestionProps<EmojiItem, EmojiItem>) => {
              storage = props.editor.storage.emoji as EmojiMenuStorage;
              storage.setActive(props);
            },
            onUpdate: (props: SuggestionProps<EmojiItem, EmojiItem>) => storage?.setActive(props),
            onExit: () => {
              storage?.setActive(null);
              storage = null;
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (!storage?.state.open) {
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
          };
        },
      },
    };
  },

  // Methods read and write through `this` because Tiptap hands each editor its
  // own storage object; closing over a local would update the wrong copy.
  addStorage() {
    return {
      ...this.parent?.(),
      limit: this.options.limit,
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
    } as EmojiMenuStorage;
  },

  markdownTokenizer: {
    name: "emoji",
    level: "inline",
    start: (src) => src.indexOf(":"),
    tokenize(src) {
      const match = SHORTCODE.exec(src);

      return match ? { type: "emoji", raw: match[0], name: match[1] } : undefined;
    },
  },
  // Markdown hooks get no extension context, so `this.options.emojis` is out
  // of reach; `emoji()` rebinds this to the configured dataset.
  parseMarkdown: parseShortcode(defaultEmojis),
});

/**
 * An unknown shortcode ("12:30:45") falls back to the text it was written
 * as; the tokenizer alone cannot tell, as it never sees the dataset.
 */
function parseShortcode(emojis: EmojiItem[]) {
  return (token: MarkdownToken, helpers: MarkdownParseHelpers): JSONContent | JSONContent[] => {
    const name = String(token.name);

    return shortcodeToEmoji(name, emojis)
      ? helpers.createNode("emoji", { name })
      : helpers.createTextNode(String(token.raw));
  };
}

/** Configures the emoji node and its `:` picker. */
export function emoji(options: Partial<EmojiOptions> = {}) {
  const extension = options.emojis
    ? Emoji.extend({ parseMarkdown: parseShortcode(options.emojis) })
    : Emoji;

  return extension.configure(options);
}
