import { Extension } from "@tiptap/core";
import type { BlockMenuItem } from "./block-menu.ts";
import type { BubbleToolbarItem } from "./bubble-toolbar.ts";
import type { PlaceholderKey } from "./placeholder.ts";

/** Text overrides for one slash item, block type, or AI action. */
export interface ItemMessage {
  title?: string;
  description?: string;
  /** Replaces the item's aliases; list the English ones too to keep them searchable. */
  aliases?: string[];
  /** Replaces the item's keywords; same rules as `aliases`. */
  keywords?: string[];
}

/**
 * Translatable strings. Every field is optional and anything left out keeps
 * its English default, so a partial translation is safe.
 */
export interface SlashEditorMessages {
  /**
   * Slash items, block types (slash, bubble and block menus), and AI actions,
   * keyed by item `id`.
   */
  items?: Record<string, ItemMessage>;
  /**
   * Slash menu section headings, keyed by the English group name
   * (`"Basic blocks"`, `"Media"`, `"AI"`, ...).
   */
  groups?: Record<string, string>;
  /** Inline hint shown after the trigger character; `slash.hint` wins over it. */
  hint?: string;
  /** Empty-block placeholders; `placeholder.text` wins over them. */
  placeholder?: Partial<Record<PlaceholderKey, string>>;
  /** Block menu item titles keyed by item `id` (`duplicate`, `delete`). */
  blockMenu?: Record<string, string>;
  /** Bubble toolbar item labels keyed by item `id` (`bold`, `link`, ...). */
  bubbleToolbar?: Record<string, string>;
}

interface LocalizableItem {
  id: string;
  title: string;
  group?: string;
  description?: string;
  aliases?: string[];
  keywords?: string[];
}

/**
 * Applies `items` and `groups` overrides to slash items, block types, or AI
 * actions. Items without an override are returned as-is.
 */
export function localizeItems<T extends LocalizableItem>(
  items: T[],
  messages?: SlashEditorMessages,
): T[] {
  if (!messages?.items && !messages?.groups) {
    return items;
  }

  return items.map((item) => {
    const message = messages.items?.[item.id];
    const group = item.group === undefined ? undefined : messages.groups?.[item.group];

    if (!message && group === undefined) {
      return item;
    }

    return {
      ...item,
      ...(message?.title !== undefined && { title: message.title }),
      ...(message?.description !== undefined && { description: message.description }),
      ...(message?.aliases !== undefined && { aliases: message.aliases }),
      ...(message?.keywords !== undefined && { keywords: message.keywords }),
      ...(group !== undefined && { group }),
    };
  });
}

/** Applies `blockMenu` title overrides. */
export function localizeBlockMenuItems(
  items: BlockMenuItem[],
  messages?: SlashEditorMessages,
): BlockMenuItem[] {
  const titles = messages?.blockMenu;

  if (!titles) {
    return items;
  }

  return items.map((item) => {
    const title = titles[item.id];
    return title === undefined ? item : { ...item, title };
  });
}

/** Applies `bubbleToolbar` label overrides. */
export function localizeBubbleToolbarItems(
  items: BubbleToolbarItem[],
  messages?: SlashEditorMessages,
): BubbleToolbarItem[] {
  const labels = messages?.bubbleToolbar;

  if (!labels) {
    return items;
  }

  return items.map((item) => {
    const label = labels[item.id];
    return label === undefined ? item : { ...item, label };
  });
}

export interface MessagesStorage {
  messages: SlashEditorMessages;
}

declare module "@tiptap/core" {
  interface Storage {
    messages: MessagesStorage;
  }
}

/**
 * Holds the editor's messages so UI hooks (e.g. `useBlockMenu`), which are not
 * extensions themselves, can read them from `editor.storage.messages`.
 */
export const Messages = Extension.create<{ messages: SlashEditorMessages }, MessagesStorage>({
  name: "messages",

  addOptions() {
    return { messages: {} };
  },

  addStorage() {
    return { messages: this.options.messages };
  },
});

export function messages(options: SlashEditorMessages = {}) {
  return Messages.configure({ messages: options });
}
