import type { Extensions } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { blockDrag, type BlockDragOptions } from "./block-drag.ts";
import { blockId, type BlockIdOptions } from "./block-id.ts";
import { bubbleToolbar, type BubbleToolbarOptions } from "./bubble-toolbar.ts";
import { Callout } from "./callout.ts";
import { slashCommand, type SlashCommandOptions } from "./slash-command.ts";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface BlockKitOptions {
  /**
   * Heading levels offered by the editor.
   *
   * @default [1, 2, 3]
   */
  headingLevels?: HeadingLevel[];
  /**
   * Local undo/redo history.
   *
   * Set to `false` when a collaboration provider owns history: Yjs ships its
   * own undo manager and running both corrupts the undo stack.
   *
   * @default true
   */
  history?: boolean;
  /**
   * Slash menu configuration, or `false` to leave the trigger character inert.
   *
   * @default { char: "/", items: defaultSlashItems }
   */
  slash?: Partial<SlashCommandOptions> | false;
  /**
   * Stable per-block id configuration, or `false` to opt out. Drag
   * targeting and the future comment/collaboration surfaces depend on it.
   *
   * @default { types: "auto" }
   */
  blockId?: Partial<BlockIdOptions> | false;
  /**
   * Block gutter drag handle: reorder and list nesting. Requires
   * `blockId`, since drag targets are addressed by id.
   *
   * @default {}
   */
  drag?: Partial<BlockDragOptions> | false;
  /**
   * Selection-anchored inline formatting toolbar, or `false` to opt out.
   *
   * @default { items: defaultBubbleToolbarItems }
   */
  bubbleToolbar?: Partial<BubbleToolbarOptions> | false;
  /**
   * Extensions appended after the baseline set. Later extensions win on
   * conflicting keymaps, so this is the seam for overriding defaults.
   */
  extend?: Extensions;
}

const DEFAULT_HEADING_LEVELS: HeadingLevel[] = [1, 2, 3];

/**
 * The baseline block schema: document, text, paragraph, headings, lists,
 * task lists, blockquote, callout, toggle (details), code block, horizontal
 * rule, hard break, and the inline marks.
 *
 * Emits no class names. UI layers style content through element selectors and
 * the `data-*` attributes rendered by slash-editor nodes.
 */
export function createBlockKit(options: BlockKitOptions = {}): Extensions {
  const {
    headingLevels = DEFAULT_HEADING_LEVELS,
    history = true,
    slash,
    blockId: blockIdOptions,
    drag,
    bubbleToolbar: bubbleToolbarOptions,
    extend = [],
  } = options;

  return [
    StarterKit.configure({
      heading: { levels: headingLevels },
      undoRedo: history ? {} : false,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Callout,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    ...(slash === false ? [] : [slashCommand(slash)]),
    ...(blockIdOptions === false ? [] : [blockId(blockIdOptions)]),
    ...(drag === false ? [] : [blockDrag(drag)]),
    ...(bubbleToolbarOptions === false ? [] : [bubbleToolbar(bubbleToolbarOptions)]),
    ...extend,
  ];
}
