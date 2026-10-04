import type { Editor, Extensions, Node } from "@tiptap/core";
import { StarterKit, type StarterKitOptions } from "@tiptap/starter-kit";
import { DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { TaskItem, type TaskItemOptions, TaskList } from "@tiptap/extension-list";
import {
  ai,
  aiBlock,
  createAiSlashItems,
  defaultAiActions,
  type AiKitOptions,
} from "./ai-block.ts";
import { blockDrag, type BlockDragOptions } from "./block-drag.ts";
import { blockId, type BlockIdOptions } from "./block-id.ts";
import {
  bubbleToolbar,
  defaultBubbleToolbarItems,
  type BubbleToolbarOptions,
} from "./bubble-toolbar.ts";
import type { CodeBlockOptions } from "./code-block.ts";
import { Callout } from "./callout.ts";
import { collaboration, type CollaborationOptions } from "./collaboration.ts";
import { column, columns, type ColumnsOptions } from "./columns.ts";
import { comment, type CommentOptions } from "./comment.ts";
import type { EmojiMenuStorage, EmojiOptions } from "./emoji.ts";
import { embed, type EmbedOptions } from "./embed.ts";
import { file, type FileOptions } from "./file.ts";
import { image, type ImageOptions } from "./image.ts";
import { linkEditor, type LinkEditorOptions } from "./link-editor.ts";
import { mention, type MentionOptions } from "./mention.ts";
import {
  localizeBubbleToolbarItems,
  localizeItems,
  messages as messagesExtension,
  type SlashEditorMessages,
} from "./messages.ts";
import { mermaid, type MermaidOptions } from "./mermaid.ts";
import { createPagesSlashItems, pages, type PagesOptions, withPageMentions } from "./pages.ts";
import { placeholder, type PlaceholderOptions } from "./placeholder.ts";
import { quote } from "./quote.ts";
import {
  blockTypes as blockTypesExtension,
  blockTypeSlashItems,
  defaultBlockTypes,
  type BlockType,
} from "./block-types.ts";
import { defaultSlashItems } from "./slash-items.ts";
import { slashCommand, type SlashCommandOptions } from "./slash-command.ts";
import { table, type TableKitOptions } from "./table.ts";
import { tableOfContents, type TableOfContentsOptions } from "./table-of-contents.ts";
import { toggle, type ToggleOptions } from "./toggle.ts";
import { video, type VideoOptions } from "./video.ts";

/**
 * StarterKit keys the kit owns. `heading`, `undoRedo`, `link`, and
 * `codeBlock` are set through `headingLevels`, `history` (and
 * `collaboration`), `link`, and `codeBlock`; `blockquote` stays off because
 * `quote()` registers its own node under that name; `gapcursor` stays off so
 * clicks in block margins focus the nearest text instead.
 */
type BlockKitOwnedStarterKitKey =
  | "heading"
  | "undoRedo"
  | "link"
  | "codeBlock"
  | "blockquote"
  | "gapcursor";

export type BlockKitStarterKitOptions = Partial<
  Omit<StarterKitOptions, BlockKitOwnedStarterKitKey>
>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface BlockKitOptions {
  /** Block conversions shared by slash, bubble, and block menus. */
  blockTypes?: BlockType[];
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
   * Options forwarded to StarterKit for the extensions the kit does not
   * configure itself: `{ underline: false }` drops the underline mark (and
   * its `Mod-u` shortcut and `++text++` markdown), `{ dropcursor: { color } }`
   * restyles the drop indicator, and so on. Keys with a dedicated option
   * (`headingLevels`, `history`, `link`, `codeBlock`) or that must stay fixed
   * (`blockquote`, `gapcursor`) are not accepted here.
   *
   * Slash items, block types, and bubble toolbar buttons hide themselves when
   * their node or mark is missing from the schema. Disabling a node another
   * node's content requires (`listItem` while `bulletList`/`orderedList` stay
   * on, `paragraph`) leaves an invalid schema.
   *
   * @default {}
   */
  starterKit?: BlockKitStarterKitOptions;
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
   * Mermaid diagram node (source only — rendering is a UI-layer `NodeView`),
   * or `false` to opt out and supply a `NodeView`-augmented variant via
   * `extend` instead (see `Mermaid`, exported for `.extend()`).
   *
   * @default {}
   */
  mermaid?: Partial<MermaidOptions> | false;
  /**
   * Syntax-highlighted code block, built by `codeBlock()` (or
   * `CodeBlock.extend(...)` for a `NodeView`) from
   * `@slash-editor/core/code-block`. Omitted, StarterKit's plain `codeBlock`
   * is used; a node here replaces it under the same name, so everything
   * addressing `codeBlock` keeps working. Opt-in, and passed in rather than
   * built here, because lowlight's grammars are sizeable and highlighting
   * costs runtime work on every edit. `false` leaves the kit with no code
   * block at all.
   */
  codeBlock?: Node<CodeBlockOptions> | false;
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
   * Link mark click behavior. Editing wants clicking a link to select it
   * (feeding `linkEditor`'s auto-open), never to navigate away mid-edit; a
   * read-only viewer passes `openOnClick: true` so links still work. `false`
   * leaves the `link` mark out of the schema entirely.
   *
   * @default { openOnClick: false, enableClickSelection: true }
   */
  link?: { openOnClick?: boolean; enableClickSelection?: boolean } | false;
  /**
   * To-do list item options (`onReadOnlyChecked` is what makes a checkbox
   * interactive in a read-only document — without it Tiptap ignores the
   * click). Spread over `{ nested: true }`.
   *
   * @default {}
   */
  taskItem?: Partial<TaskItemOptions>;
  /**
   * Selection-anchored link editing popover, or `false` to opt out.
   * Requires the `link` mark, so it depends on `link` staying enabled.
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
   * Emoji node with a `:shortcode:` picker, built by `emoji()` from
   * `@slash-editor/core/emoji`; registering it also shows the `/emoji` slash
   * item. Opt-in, and passed in rather than built here, because the emoji
   * dataset is sizeable and enabling it turns typed `:shortcode:` text into
   * emoji nodes.
   */
  emoji?: Node<EmojiOptions, EmojiMenuStorage> | false;
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
   * Notion-style pages: `subPage` blocks, inline `pageLink`s, `/page` and
   * `/link to page`, page entries in the `@` menu, and detach/attach reports,
   * all backed by a host-provided `PageStore`. Omit to leave them out — there
   * is no default store. The editor shows one page; remount it per page.
   */
  pages?: PagesOptions | false;
  /**
   * Document outline store (top-level headings, recomputed on change), or
   * `false` to opt out. An outline is read-only state, not an insertable
   * block, so this registers no slash item; and with no subscriber listening
   * it never scans the document at all.
   *
   * @default {}
   */
  tableOfContents?: Partial<TableOfContentsOptions> | false;
  /**
   * Toggle (details) node configuration. Options only — the node itself is
   * unconditional, like blockquote. This is the seam a UI layer uses to
   * render its own disclosure marker via `renderToggleButton`.
   *
   * @default { persist: true }
   */
  toggle?: Partial<ToggleOptions>;
  /**
   * Translations for slash items, block types, AI actions, placeholders, the
   * slash hint, block menu actions, and bubble toolbar labels. Anything left
   * out keeps its English default. Also readable at `editor.storage.messages`.
   *
   * @default {}
   */
  messages?: SlashEditorMessages;
}

const DEFAULT_HEADING_LEVELS: HeadingLevel[] = [1, 2, 3];

/**
 * The baseline block schema: document, text, paragraph, headings, lists,
 * task lists, blockquote, callout, toggle (details), code block, Mermaid
 * diagram, horizontal rule, hard break, and the inline marks.
 *
 * Emits no class names. UI layers style content through element selectors and
 * the `data-*` attributes rendered by slash-editor nodes.
 */
export function createBlockKit(options: BlockKitOptions = {}): Extensions {
  const {
    messages,
    blockTypes = defaultBlockTypes,
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
    codeBlock: codeBlockOption,
    mermaid: mermaidOptions,
    table: tableOptions,
    columns: columnsOptions,
    linkEditor: linkEditorOptions,
    mention: mentionOptions,
    pages: pagesOptions,
    emoji: emojiOption,
    ai: aiOptions,
    comment: commentOptions,
    collaboration: collaborationOptions,
    link: linkOptions,
    taskItem: taskItemOptions,
    tableOfContents: tableOfContentsOptions,
    toggle: toggleOptions,
    extend = [],
    starterKit: starterKitOptions,
  } = options;
  const resolvedAi: AiKitOptions | undefined = aiOptions
    ? { actions: defaultAiActions, node: true, ...aiOptions }
    : undefined;
  const resolvedMention =
    mentionOptions === false
      ? undefined
      : pagesOptions
        ? withPageMentions(mentionOptions, pagesOptions, messages?.untitledPage)
        : mentionOptions;
  const localizedBlockTypes = localizeItems(blockTypes, messages);
  const localizedAi = resolvedAi && {
    ...resolvedAi,
    actions: localizeItems(resolvedAi.actions, messages),
  };
  const bubbleSource =
    (bubbleToolbarOptions === false ? undefined : bubbleToolbarOptions?.items) ??
    defaultBubbleToolbarItems;
  const bubbleItems =
    typeof bubbleSource === "function"
      ? (editor: Editor) => localizeBubbleToolbarItems(bubbleSource(editor), messages)
      : localizeBubbleToolbarItems(bubbleSource, messages);

  // Yjs owns the undo stack once a document is shared; running StarterKit's
  // undoRedo alongside it corrupts it, so collaboration always wins.
  const resolvedHistory = collaborationOptions ? false : history;

  return [
    StarterKit.configure({
      ...starterKitOptions,
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
      // auto-open), never to navigate away mid-edit. A read-only viewer
      // passes `link: { openOnClick: true }` to make links navigate again.
      link:
        linkOptions === false
          ? false
          : { openOnClick: false, enableClickSelection: true, ...linkOptions },
      // A highlighted `codeBlock` (or `false`) replaces StarterKit's plain one.
      codeBlock: codeBlockOption === undefined ? undefined : false,
      // `>` belongs to the toggle; quote() re-registers blockquote with the
      // `"` shorthand instead.
      blockquote: false,
    }),
    quote(),
    ...(codeBlockOption ? [codeBlockOption] : []),
    TaskList,
    TaskItem.configure({ nested: true, ...taskItemOptions }),
    Callout,
    toggle({ persist: true, ...toggleOptions }),
    blockTypesExtension(localizedBlockTypes),
    messagesExtension(messages),
    DetailsSummary,
    DetailsContent,
    ...(imageOptions === false ? [] : [image(imageOptions)]),
    ...(fileOptions === false ? [] : [file(fileOptions)]),
    ...(videoOptions === false ? [] : [video(videoOptions)]),
    ...(embedOptions === false ? [] : [embed(embedOptions)]),
    ...(mermaidOptions === false ? [] : [mermaid(mermaidOptions)]),
    ...(tableOptions === false ? [] : [table(tableOptions)]),
    ...(columnsOptions === false ? [] : [columns(columnsOptions), column()]),
    ...(localizedAi ? [ai(localizedAi)] : []),
    ...(localizedAi && localizedAi.node !== false ? [aiBlock()] : []),
    ...(pagesOptions ? pages(pagesOptions, messages?.untitledPage) : []),
    ...(resolvedMention ? [mention(resolvedMention)] : []),
    ...(emojiOption ? [emojiOption] : []),
    ...(slash === false
      ? []
      : [
          slashCommand({
            ...slash,
            ...(slash?.hint === undefined &&
              messages?.hint !== undefined && { hint: messages.hint }),
            items: localizeItems(
              [
                ...blockTypeSlashItems(blockTypes),
                ...defaultSlashItems.filter(
                  (item) => !blockTypes.some((type) => type.id === item.id),
                ),
                ...(resolvedAi ? createAiSlashItems(resolvedAi.actions) : []),
                ...(pagesOptions ? createPagesSlashItems() : []),
              ],
              messages,
            ),
          }),
        ]),
    ...(placeholderOptions === false
      ? []
      : [
          placeholder({
            ...placeholderOptions,
            ...(messages?.placeholder && {
              text: { ...messages.placeholder, ...placeholderOptions?.text },
            }),
          }),
        ]),
    ...(blockIdOptions === false ? [] : [blockId(blockIdOptions)]),
    ...(drag === false ? [] : [blockDrag(drag)]),
    ...(bubbleToolbarOptions === false
      ? []
      : [bubbleToolbar({ ...bubbleToolbarOptions, items: bubbleItems })]),
    ...(linkEditorOptions === false ? [] : [linkEditor(linkEditorOptions)]),
    ...(tableOfContentsOptions === false ? [] : [tableOfContents(tableOfContentsOptions)]),
    ...(collaborationOptions === false || !collaborationOptions
      ? []
      : [...collaboration(collaborationOptions)]),
    ...(commentOptions === false ? [] : [comment(commentOptions)]),
    ...extend,
  ];
}
