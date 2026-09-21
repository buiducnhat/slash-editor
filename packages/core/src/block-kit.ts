import type { Extensions } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  aiBlock,
  type AiKitOptions,
  createAiSlashItems,
  defaultAiSlashActions,
} from "./ai-block.ts";
import { blockDrag, type BlockDragOptions } from "./block-drag.ts";
import { blockId, type BlockIdOptions } from "./block-id.ts";
import { bubbleToolbar, type BubbleToolbarOptions } from "./bubble-toolbar.ts";
import { Callout } from "./callout.ts";
import { column, columns, type ColumnsOptions } from "./columns.ts";
import { embed, type EmbedOptions } from "./embed.ts";
import { file, type FileOptions } from "./file.ts";
import { image, type ImageOptions } from "./image.ts";
import { linkEditor, type LinkEditorOptions } from "./link-editor.ts";
import { mention, type MentionOptions } from "./mention.ts";
import { defaultSlashItems, type SlashItem } from "./slash-items.ts";
import { slashCommand, type SlashCommandOptions } from "./slash-command.ts";
import { table, type TableKitOptions } from "./table.ts";
import { video, type VideoOptions } from "./video.ts";

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
  /**
   * Image node configuration, or `false` to opt out and supply a
   * `NodeView`-augmented variant via `extend` instead (see `Image`,
   * exported for `.extend()`).
   *
   * @default {}
   */
  image?: Partial<ImageOptions> | false;
  /**
   * File attachment node configuration, or `false` to opt out.
   *
   * @default {}
   */
  file?: Partial<FileOptions> | false;
  /**
   * Video node configuration, or `false` to opt out.
   *
   * @default {}
   */
  video?: Partial<VideoOptions> | false;
  /**
   * Bookmark/iframe embed node configuration, or `false` to opt out.
   *
   * @default {}
   */
  embed?: Partial<EmbedOptions> | false;
  /**
   * Table kit configuration (resizable columns on by default), or `false`
   * to opt out.
   *
   * @default { table: { resizable: true } }
   */
  table?: Partial<TableKitOptions> | false;
  /**
   * Columns container configuration, or `false` to opt out.
   *
   * @default {}
   */
  columns?: Partial<ColumnsOptions> | false;
  /**
   * Selection-anchored link editing popover, or `false` to opt out.
   * Requires the `link` mark, configured on by `createBlockKit` with
   * `openOnClick: false, enableClickSelection: true` so clicking a link
   * while editing selects it instead of navigating away.
   *
   * @default {}
   */
  linkEditor?: Partial<LinkEditorOptions> | false;
  /**
   * `@`-mention node with an async, bring-your-own provider. Omit to leave
   * the trigger character inert — there is no default provider to fall
   * back to, unlike the always-on `slash` menu.
   */
  mention?: (Partial<MentionOptions> & Pick<MentionOptions, "items">) | false;
  /**
   * AI slash actions (`Continue writing`, `Summarize`, …) streamed through
   * a bring-your-own `StreamAdapter`. Omit to leave those slash items out —
   * there is no default adapter to fall back to.
   */
  ai?: (Partial<AiKitOptions> & Pick<AiKitOptions, "adapter">) | false;
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
    image: imageOptions,
    file: fileOptions,
    video: videoOptions,
    embed: embedOptions,
    table: tableOptions,
    columns: columnsOptions,
    linkEditor: linkEditorOptions,
    mention: mentionOptions,
    ai: aiOptions,
    extend = [],
  } = options;

  const resolvedAi: AiKitOptions | undefined = aiOptions
    ? { actions: defaultAiSlashActions, node: true, ...aiOptions }
    : undefined;

  return [
    StarterKit.configure({
      heading: { levels: headingLevels },
      undoRedo: history ? {} : false,
      // Editing wants clicking a link to select it (feeding LinkEditor's
      // auto-open), never to navigate away mid-edit.
      link: { openOnClick: false, enableClickSelection: true },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Callout,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    ...(imageOptions === false ? [] : [image(imageOptions)]),
    ...(fileOptions === false ? [] : [file(fileOptions)]),
    ...(videoOptions === false ? [] : [video(videoOptions)]),
    ...(embedOptions === false ? [] : [embed(embedOptions)]),
    ...(tableOptions === false ? [] : [table(tableOptions)]),
    ...(columnsOptions === false ? [] : [columns(columnsOptions), column()]),
    ...(resolvedAi && resolvedAi.node !== false ? [aiBlock()] : []),
    ...(mentionOptions === false || !mentionOptions ? [] : [mention(mentionOptions)]),
    ...(slash === false
      ? []
      : [
          slashCommand({
            ...slash,
            items:
              slash?.items ??
              ((): SlashItem[] => [
                ...defaultSlashItems,
                ...(resolvedAi ? createAiSlashItems(resolvedAi) : []),
              ])(),
          }),
        ]),
    ...(blockIdOptions === false ? [] : [blockId(blockIdOptions)]),
    ...(drag === false ? [] : [blockDrag(drag)]),
    ...(bubbleToolbarOptions === false ? [] : [bubbleToolbar(bubbleToolbarOptions)]),
    ...(linkEditorOptions === false ? [] : [linkEditor(linkEditorOptions)]),
    ...extend,
  ];
}
