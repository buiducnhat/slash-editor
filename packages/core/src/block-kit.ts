import type { Extensions } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { DetailsContent, DetailsSummary } from "@tiptap/extension-details";
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
import { collaboration, type CollaborationOptions } from "./collaboration.ts";
import { column, columns, type ColumnsOptions } from "./columns.ts";
import { comment, type CommentOptions } from "./comment.ts";
import { embed, type EmbedOptions } from "./embed.ts";
import { file, type FileOptions } from "./file.ts";
import { image, type ImageOptions } from "./image.ts";
import { linkEditor, type LinkEditorOptions } from "./link-editor.ts";
import { mention, type MentionOptions } from "./mention.ts";
import { placeholder, type PlaceholderOptions } from "./placeholder.ts";
import { quote } from "./quote.ts";
import { defaultSlashItems, type SlashItem } from "./slash-items.ts";
import { slashCommand, type SlashCommandOptions } from "./slash-command.ts";
import { table, type TableKitOptions } from "./table.ts";
import { toggle, type ToggleOptions } from "./toggle.ts";
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
   * Empty-block placeholder hints, or `false` to render none. Only the block
   * holding the caret shows one.
   *
   * @default {}
   */
  placeholder?: PlaceholderOptions | false;
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
  /**
   * Shared Yjs document, network provider, and presence config. No
   * default — omit to run local-only. Forces `history: false` (Yjs owns
   * the undo stack once a document is shared) regardless of the `history`
   * option.
   */
  collaboration?: CollaborationOptions | false;
  /**
   * Comment mark (`threadId` anchor) plus the selection-driven active-thread
   * state a UI reads to open a thread panel. Thread bodies live in a
   * host-provided `CommentThreadStore`, never in the document.
   *
   * @default {}
   */
  comment?: Partial<CommentOptions> | false;
  /**
   * Toggle (details) node configuration. Options only — the node itself is
   * unconditional, like blockquote. This is the seam a UI layer uses to
   * render its own disclosure marker via `renderToggleButton`.
   *
   * @default { persist: true }
   */
  toggle?: Partial<ToggleOptions>;
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
    placeholder: placeholderOptions,
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
    collaboration: collaborationOptions,
    comment: commentOptions,
    toggle: toggleOptions,
    extend = [],
  } = options;

  const resolvedAi: AiKitOptions | undefined = aiOptions
    ? { actions: defaultAiSlashActions, node: true, ...aiOptions }
    : undefined;

  // Yjs owns the undo stack once a document is shared; running StarterKit's
  // undoRedo alongside it corrupts it, so collaboration always wins.
  const resolvedHistory = collaborationOptions ? false : history;

  return [
    StarterKit.configure({
      /*
       * No gap cursor. ProseMirror hands one to any click that lands on an
       * isolated block's boundary — the strip a margin leaves between two
       * blocks, the space beside an atom — and typing there inserts a new
       * block instead of continuing the nearest line. Clicking empty space
       * focuses the closest text position instead, which is what a block
       * editor's whitespace should do.
       */
      gapcursor: false,
      heading: { levels: headingLevels },
      undoRedo: resolvedHistory ? {} : false,
      // Editing wants clicking a link to select it (feeding LinkEditor's
      // auto-open), never to navigate away mid-edit.
      link: { openOnClick: false, enableClickSelection: true },
      // `>` belongs to the toggle; quote() re-registers blockquote with the
      // `"` shorthand instead.
      blockquote: false,
    }),
    quote(),
    TaskList,
    TaskItem.configure({ nested: true }),
    Callout,
    toggle({ persist: true, ...toggleOptions }),
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
    ...(placeholderOptions === false ? [] : [placeholder(placeholderOptions)]),
    ...(blockIdOptions === false ? [] : [blockId(blockIdOptions)]),
    ...(drag === false ? [] : [blockDrag(drag)]),
    ...(bubbleToolbarOptions === false ? [] : [bubbleToolbar(bubbleToolbarOptions)]),
    ...(linkEditorOptions === false ? [] : [linkEditor(linkEditorOptions)]),
    ...(collaborationOptions === false || !collaborationOptions
      ? []
      : [...collaboration(collaborationOptions)]),
    ...(commentOptions === false ? [] : [comment(commentOptions)]),
    ...extend,
  ];
}
