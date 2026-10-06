import { emoji } from "@slash-editor/core/emoji";
import { markdown } from "@slash-editor/core/markdown";
import type { UseSlashEditorOptions } from "@slash-editor/react";
import { searchMentions } from "@/lib/mention-provider.ts";
import { nodeViewExtensions } from "@/lib/node-view-extensions.tsx";
import { streamAdapter } from "@/lib/stream-adapter.ts";

/**
 * Extensions that carry the React node views. Declared at module scope so the
 * list is the same object for every editor.
 */
export const KIT_EXTENSIONS = [...nodeViewExtensions(), markdown()];

/**
 * The `blockKit` every demo starts from: all blocks, wired to the route
 * handlers in `app/api`. Spread it and override or add options per page:
 *
 * ```ts
 * useDemoEditor({ blockKit: { ...BLOCK_KIT, comment: { store } } });
 * ```
 */
export const BLOCK_KIT = {
  // `nodeViewExtensions()` registers these with their React node views;
  // leaving the defaults on would register each node twice.
  image: false,
  file: false,
  video: false,
  embed: false,
  mermaid: false,
  codeBlock: false,
  emoji: emoji(),
  ai: { adapter: streamAdapter, node: false },
  mention: { items: searchMentions },
  extend: KIT_EXTENSIONS,
} satisfies NonNullable<Exclude<UseSlashEditorOptions["blockKit"], false>>;

/** Class list for the editable surface: room for the block handle on the left. */
export const EDITOR_CLASS = "slash-content min-h-[60vh] py-10 pr-8 pl-24";
