# Package APIs

Everything exported today. Both packages ship ESM only (`dist/index.mjs` + `dist/index.d.mts`).

## `@slash-editor/core`

```ts
// block-kit.ts
function createBlockKit(options?: BlockKitOptions): Extensions;
interface BlockKitOptions {
  headingLevels?: HeadingLevel[]; // default [1, 2, 3]
  history?: boolean; // default true
  slash?: Partial<SlashCommandOptions> | false;
  blockId?: Partial<BlockIdOptions> | false; // default { types: "auto" }
  drag?: Partial<BlockDragOptions> | false; // default {}
  bubbleToolbar?: Partial<BubbleToolbarOptions> | false; // default { items: defaultBubbleToolbarItems }
  image?: Partial<ImageOptions> | false;
  file?: Partial<FileOptions> | false;
  video?: Partial<VideoOptions> | false;
  embed?: Partial<EmbedOptions> | false;
  table?: Partial<TableKitOptions> | false; // default { table: { resizable: true } }
  columns?: Partial<ColumnsOptions> | false;
  linkEditor?: Partial<LinkEditorOptions> | false; // default {}
  // No default provider/adapter, so these are opt-in (undefined -> not registered), not `Partial<X> | false`:
  mention?: (Partial<MentionOptions> & Pick<MentionOptions, "items">) | false;
  ai?: (Partial<AiKitOptions> & Pick<AiKitOptions, "adapter">) | false;
  extend?: Extensions;
}
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Baseline schema also carries taskList/taskItem (@tiptap/extension-list, nested: true) and
// details/detailsSummary/detailsContent (@tiptap/extension-details, persist: true) unconditionally,
// the same way StarterKit's blockquote and codeBlock are unconditional — no BlockKitOptions seam.

// callout.ts
const Callout: Node<CalloutOptions>;
function callout(options?: Partial<CalloutOptions>): Node;

interface CalloutOptions {
  defaultIcon: string; // default "💡"
  HTMLAttributes: Record<string, unknown>;
}
// editor.commands.setCallout/toggleCallout/unsetCallout — wrapIn/toggleWrap/lift over "callout"

// bubble-toolbar.ts
const BubbleToolbar: Extension<BubbleToolbarOptions, BubbleToolbarStorage>;
function bubbleToolbar(options?: Partial<BubbleToolbarOptions>): Extension;

interface BubbleToolbarOptions {
  items: BubbleToolbarItem[] | ((editor: Editor) => BubbleToolbarItem[]);
}

interface BubbleToolbarItem {
  id: string;
  label: string;
  icon?: string; // icon *key*, resolved by the UI layer
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  when?: (editor: Editor) => boolean;
}

interface BubbleToolbarState {
  open: boolean;
  items: BubbleToolbarItem[]; // already filtered by `when`
  getClientRect: (() => DOMRect | null) | null;
}

interface BubbleToolbarStorage {
  // editor.storage.bubbleToolbar
  state: BubbleToolbarState;
  subscribe(listener: () => void): () => void;
}

function filterBubbleToolbarItems(items: BubbleToolbarItem[], editor: Editor): BubbleToolbarItem[];
const defaultBubbleToolbarItems: BubbleToolbarItem[]; // ids: bold, italic, strike, code
// Visibility is recomputed on onTransaction/onFocus/onBlur: open only for a non-empty
// TextSelection in a focused, editable view. Rank/query don't apply here — unlike the
// slash menu there's nothing to type, so filtering is just `when` gating.

// block-id.ts
const BlockId: Extension<BlockIdOptions>;
function blockId(options?: Partial<BlockIdOptions>): Extension;
const blockIdPluginKey: PluginKey;
const BLOCK_ID_REMOTE_META: string; // transaction meta a sync provider sets to skip assignment

interface BlockIdOptions {
  types: string[] | "auto"; // default "auto": every node with a `block` group or content
  exclude: string[];
}

// block-drag.ts
const BlockDrag: Extension<BlockDragOptions, BlockDragStorage>;
function blockDrag(options?: Partial<BlockDragOptions>): Extension;
const blockDragPluginKey: PluginKey;

interface BlockDragOptions {
  gutterWidth: number; // default 48
  indentThreshold: number; // default 32
  autoScrollMargin: number; // default 48
  onError?: (error: unknown, ctx: { editor: Editor }) => void;
}

interface BlockTarget {
  pos: number;
  size: number;
  type: string;
  id: string | null;
  getClientRect: () => DOMRect | null;
}

interface BlockDragState {
  hovered: BlockTarget | null;
  dragging: BlockTarget | null;
  drop: (DropTarget & { getClientRect: () => DOMRect | null }) | null;
}

interface BlockDragStorage {
  // editor.storage.blockDrag
  state: BlockDragState;
  subscribe(listener: () => void): () => void;
  setHovered(target: BlockTarget | null): void;
  setDragging(target: BlockTarget | null): void;
  setDrop(drop: BlockDragState["drop"]): void;
}

// editor.commands.moveBlock/moveBlockUp/moveBlockDown/duplicateBlock/deleteBlock; Alt-Shift-ArrowUp/Down bound by default

// Pure geometry, testable without a DOM:
function resolveDropTarget(
  blocks: readonly BlockRect[],
  point: { x: number; y: number },
  source: BlockRect,
  options: ResolveDropTargetOptions,
): DropTarget | null;
function canAppendChild(target: PMNode, source: NodeType): boolean;

// slash-command.ts
const SlashCommand: Extension<SlashCommandOptions, SlashCommandStorage>;
function slashCommand(options?: Partial<SlashCommandOptions>): Extension;
const slashCommandPluginKey: PluginKey;

interface SlashCommandOptions {
  char: string; // default "/"
  items: SlashItem[] | ((editor: Editor) => SlashItem[]);
  onError?: (error: unknown, ctx: { item: SlashItem; editor: Editor }) => void;
}

interface SlashMenuState {
  open: boolean;
  query: string;
  items: SlashItem[];
  activeIndex: number; // -1 when nothing matches
  getClientRect: (() => DOMRect | null) | null;
}

interface SlashCommandStorage {
  // editor.storage.slashCommand
  state: SlashMenuState;
  subscribe(listener: () => void): () => void;
  setActiveIndex(index: number): void; // wraps around
  select(index?: number): void; // defaults to activeIndex
  close(): void;
}

// slash-items.ts
interface SlashItem {
  id: string;
  title: string;
  group: string;
  description?: string;
  aliases?: string[]; // ranked like the title
  keywords?: string[]; // never displayed
  icon?: string; // icon *key*, resolved by the UI layer
  when?: (editor: Editor) => boolean;
  run: (context: SlashContext) => void; // { editor, range }
}
function filterSlashItems(items: SlashItem[], query: string, editor?: Editor): SlashItem[];
const defaultSlashItems: SlashItem[];
```

`defaultSlashItems` ids: `paragraph`, `heading-1`, `heading-2`, `heading-3`, `bullet-list`,
`ordered-list`, `task-list`, `blockquote`, `callout`, `toggle`, `code-block`, `horizontal-rule`
(group `"Basic blocks"`), `image`, `file`, `video`, `embed` (group `"Media"`), `table`, `columns`
(group `"Structure"`) — each gated on schema presence via `when`.

The module augments `@tiptap/core`'s `Storage` interface so `editor.storage.slashCommand` is typed at every call site.

```ts
// upload.ts — shared by image.ts/file.ts/video.ts, not a Tiptap extension itself
type UploadStatus = "uploading" | "ready" | "error";
interface UploadContext {
  signal: AbortSignal;
}
interface UploadResult {
  url: string;
}
interface UploadAdapter<TResult extends UploadResult = UploadResult> {
  upload(file: File, context: UploadContext): Promise<TResult>;
}

interface BlockLocation {
  pos: number;
  node: PMNode;
}
// Pure: takes a doc, not an editor.
function findNodeById(doc: PMNode, id: string): BlockLocation | null;

// Per-node-type registry of in-flight/failed uploads keyed by BlockId `id`. The picked `File`
// never touches doc attrs (not JSON-serializable, not Yjs-safe) — it lives here instead, so
// retry resends it without the user picking again.
class PendingUploadRegistry {
  set(id: string, entry: { file: File; adapter: UploadAdapter; controller: AbortController }): void;
  get(id: string): { file: File; adapter: UploadAdapter; controller: AbortController } | undefined;
  delete(id: string): void;
}

// Starts an upload for a node already in the doc, resolved by `id` (not a captured position).
// Completion dispatches with `addToHistory: false`, so it is never a separate undo step.
function runUpload<TResult extends UploadResult>(options: {
  editor: Editor;
  typeName: string;
  id: string;
  file: File;
  adapter: UploadAdapter<TResult>;
  pending: PendingUploadRegistry;
  toAttrs: (result: TResult) => Record<string, unknown>;
}): void;

// (Re)starts from the last `File` passed to runUpload for this id, or from `override` —
// the same path also covers "attach a file to an empty placeholder" (nothing pending yet).
function retryUpload<TResult extends UploadResult>(options: {
  editor: Editor;
  typeName: string;
  id: string;
  pending: PendingUploadRegistry;
  toAttrs: (result: TResult) => Record<string, unknown>;
  override?: { file: File; adapter: UploadAdapter<TResult> };
}): boolean;

// image.ts / file.ts / video.ts share this shape: `status`/`error` live in doc attrs (part of
// the doc, so completion re-renders through the normal transaction pipeline, not a subscribe
// channel like the slash menu/bubble toolbar/block drag). `set<Type>()` with no options inserts
// an empty placeholder a NodeView can fill in later via `retry<Type>(id, { file, adapter })`.
const Image: Node<ImageOptions, ImageStorage>;
function image(options?: Partial<ImageOptions>): Node;
interface ImageOptions {
  HTMLAttributes: Record<string, unknown>;
}
// editor.commands.setImage({ file, adapter, alt? } | { src, alt?, width? } | undefined)
// editor.commands.retryImage(id, override?: { file, adapter })
// attrs: src, alt, width, status, error

const File: Node<FileOptions, FileStorage>; // same shape as Image; setFile/retryFile
// attrs: src, name, size, mime, status, error — name/size/mime read from the File immediately

const Video: Node<VideoOptions, VideoStorage>; // same shape as Image; setVideo/retryVideo
// attrs: src, poster, status, error

// embed.ts — no adapter: nothing async, the URL is set directly.
const Embed: Node<EmbedOptions>;
function embed(options?: Partial<EmbedOptions>): Node;
// editor.commands.setEmbed({ url?, mode?: "bookmark" | "iframe", title?, description?, thumbnail? })
// attrs: url, mode (default "bookmark"), title, description, thumbnail

// table.ts — thin wrapper over @tiptap/extension-table's TableKit (table/tableRow/tableHeader/tableCell).
function table(options?: Partial<TableKitOptions>): Extension; // default { table: { resizable: true } }
// editor.commands.insertTable/addColumnBefore/addColumnAfter/deleteColumn/addRowBefore/…

// columns.ts — container node: the first M2 nesting surface beyond lists.
const Columns: Node<ColumnsOptions>; // content: "column{2,}" — bakes the two-column floor into the schema
const Column: Node<ColumnOptions>; // content: "block+", not a `block`-group node on its own
function columns(options?: Partial<ColumnsOptions>): Node;
function column(options?: Partial<ColumnOptions>): Node;
// editor.commands.setColumns(count?: number) // clamped to 2–6, default 2
```

Every M2 node is `false`-opt-out-able from `createBlockKit`, the same seam M1 used for
`slash`/`blockId`/`drag`/`bubbleToolbar`. A host that needs a `NodeView` (e.g. React) opts the
baseline node out and supplies its own via `extend`, keeping a single schema registration:
`Image.extend({ addNodeView: () => ReactNodeViewRenderer(ImageNodeView) })` — see
`demo-react/src/app.tsx` and `src/components/nodes/*`.

```ts
// mention.ts — @-mention node built on @tiptap/suggestion's native async provider support.
const Mention: Node<MentionOptions, MentionStorage>;
function mention(options: Partial<MentionOptions> & Pick<MentionOptions, "items">): Node; // items required, no default
const mentionPluginKey: PluginKey;

interface MentionItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}
interface MentionOptions {
  char: string; // default "@"
  items: (
    query: string,
    context: { editor: Editor; signal: AbortSignal },
  ) => MentionItem[] | Promise<MentionItem[]>;
  debounce: number; // default 150
  minQueryLength: number; // default 0
  HTMLAttributes: Record<string, unknown>;
  onError?: (error: unknown, context: { editor: Editor }) => void;
}
interface MentionState {
  open: boolean;
  query: string;
  items: MentionItem[];
  activeIndex: number;
  loading: boolean; // true while the provider's promise for the current query is in flight
  getClientRect: (() => DOMRect | null) | null;
}
interface MentionStorage {
  // editor.storage.mention — same subscribe/setActiveIndex/select/close shape as SlashCommandStorage
  state: MentionState;
  subscribe(listener: () => void): () => void;
  setActiveIndex(index: number): void;
  select(index?: number): void;
  close(): void;
}
// editor.commands.insertMention(item: MentionItem) — for programmatic use; selecting a suggestion
// result inserts inline at the trigger range in one transaction instead.
```

`@tiptap/suggestion`'s `items` already accepts `I[] | Promise<I[]>` plus `debounce`/`minQueryLength`/an
`AbortSignal`, and aborts a stale in-flight call itself the moment a newer keystroke supersedes it —
`Mention` passes `MentionOptions.items` straight through, catching a rejection into `onError` and an
empty result set rather than leaving the menu stuck loading.

```ts
// link-editor.ts — selection-anchored link editing popover; owns only visibility + draft href.
const LinkEditor: Extension<LinkEditorOptions, LinkEditorStorage>;
function linkEditor(options?: Partial<LinkEditorOptions>): Extension;
function canOpenLinkEditor(editor: Editor): boolean; // link mark present, editable, and (non-empty selection or cursor in a link)

interface LinkEditorOptions {
  autoOpenOnLinkActive: boolean; // default true — opens (editing: true) when the cursor lands in a link
}
interface LinkEditorState {
  open: boolean;
  href: string; // draft value shown in the popover input
  editing: boolean; // true editing an existing link; false drafting one over a fresh selection
  getClientRect: (() => DOMRect | null) | null;
}
interface LinkEditorStorage {
  // editor.storage.linkEditor
  state: LinkEditorState;
  subscribe(listener: () => void): () => void;
}
// editor.commands.openLinkEditor() / setLinkEditorHref(href) / closeLinkEditor()
// Applying/removing the link is not a core command: a UI layer calls the `link` mark's own
// setLink/unsetLink (from @tiptap/extension-link) directly, then closeLinkEditor() — the same way a
// BubbleToolbarItem calls toggleBold directly. createBlockKit configures StarterKit's `link` with
// `openOnClick: false, enableClickSelection: true` so clicking a link while editing selects it
// (feeding this extension's auto-open) instead of navigating away.
```

```ts
// ai-block.ts — transient AI response block + bring-your-own StreamAdapter contract.
const AiBlock: Node<AiBlockOptions, AiBlockStorage>;
function aiBlock(options?: Partial<AiBlockOptions>): Node;

type AiActionStatus = "streaming" | "done" | "error";
interface StreamContext {
  signal: AbortSignal; // aborted on retry or discard
}
interface AiRequest {
  action: string; // the triggering slash action id, e.g. "continue-writing"
  prompt: string;
  context: string; // plain-text context the prompt operates on
}
interface StreamAdapter {
  stream(request: AiRequest, context: StreamContext): AsyncIterable<string>;
}
// editor.commands.runAiAction({ action, prompt, context, adapter }) — inserts the transient node, starts streaming
// editor.commands.retryAiAction(id) — replays the last request/adapter for this node from scratch
// editor.commands.acceptAiAction(id) — replaces the node with real paragraph(s) built from its streamed text
// editor.commands.discardAiAction(id) — removes the node, aborting any in-flight stream
// attrs: action, prompt, text (accumulated so far), status, error

class PendingAiRegistry {
  // Per-node registry keyed by id; unlike PendingUploadRegistry, entries are KEPT on success too
  // (kept for "try again"), only dropped (aborting anything in flight) on discard/accept.
  set(
    id: string,
    entry: { request: AiRequest; adapter: StreamAdapter; controller: AbortController },
  ): void;
  get(
    id: string,
  ): { request: AiRequest; adapter: StreamAdapter; controller: AbortController } | undefined;
  delete(id: string): void;
}

interface AiSlashAction {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  prompt: string; // instruction sent to the model
}
const defaultAiSlashActions: AiSlashAction[]; // ids: continue-writing, summarize, brainstorm-ideas, fix-spelling-grammar

interface AiKitOptions {
  adapter: StreamAdapter;
  actions: AiSlashAction[]; // default defaultAiSlashActions
  node: boolean; // default true; false to opt out of the built-in NodeView registration (see below)
}
function createAiSlashItems(options: Pick<AiKitOptions, "adapter" | "actions">): SlashItem[];
// Every generated item's context is the document text up to the slash trigger — a slash command
// never carries a real user text selection the way a bubble-toolbar action does.
```

## `@slash-editor/react`

```ts
function useSlashEditor(options?: UseSlashEditorOptions): Editor | null;
interface UseSlashEditorOptions extends Omit<UseEditorOptions, "extensions"> {
  blockKit?: BlockKitOptions | false;
  extensions?: Extensions;
}

function useSlashMenu(editor: Editor | null): SlashMenu;
interface SlashMenu extends SlashMenuState {
  activeItem: SlashItem | null;
  anchor: SlashMenuAnchor | null; // { getBoundingClientRect } virtual element
  setActiveIndex(index: number): void;
  select(index?: number): void;
  close(): void;
}

function useBlockDrag(editor: Editor | null): BlockDrag;
interface BlockDrag extends BlockDragState {
  hoverAnchor: BlockDragAnchor | null;
  dropAnchor: BlockDragAnchor | null;
  menuAnchor: BlockDragAnchor | null; // block context menu anchor; null while closed
  menuTarget: BlockTarget | null;
  closeMenu: () => void;
  handleProps: { onPointerDown: (event: React.PointerEvent) => void };
}

function useBubbleToolbar(editor: Editor | null): BubbleToolbar;
interface BubbleToolbar extends BubbleToolbarState {
  anchor: BubbleToolbarAnchor | null; // { getBoundingClientRect } virtual element
}

function useMention(editor: Editor | null): MentionMenu;
interface MentionMenu extends MentionState {
  activeItem: MentionItem | null;
  anchor: MentionMenuAnchor | null; // { getBoundingClientRect } virtual element
  setActiveIndex(index: number): void;
  select(index?: number): void;
  close(): void;
}

function useLinkEditor(editor: Editor | null): LinkEditor;
interface LinkEditor extends LinkEditorState {
  anchor: LinkEditorAnchor | null; // { getBoundingClientRect } virtual element
  setHref(href: string): void;
  confirm(): void; // setLink(href) then closeLinkEditor()
  remove(): void; // unsetLink() then closeLinkEditor()
  close(): void;
}
```

Re-exported from `@tiptap/react` so consumers need one import: `EditorContent`, `EditorContext`, `EditorProvider`, `useCurrentEditor`, `useEditorState`.

`useSlashMenu`, `useBlockDrag`, `useBubbleToolbar`, `useMention`, and `useLinkEditor` are all safe with a `null` editor (closed state, no-op callbacks), which matters because `useSlashEditor` returns `null` on the first render.

`useBlockDrag`'s click-vs-drag disambiguation lives entirely in the hook (not core): a grip press that stays within 4px opens `menuTarget`; past that it calls `storage.setDragging`. It is pure DOM gesture handling, not editor state.

`useLinkEditor.confirm`/`.remove` are composed in the hook, not as core commands: they call the `link`
mark's own `setLink`/`unsetLink` directly (see `link-editor.ts` above), then `closeLinkEditor()`. After
`confirm`, the selection still rests on the just-created link, so `LinkEditor`'s own auto-open recomputes
the popover right back into `editing: true` — the same state a click on any existing link produces, not
a separate "just created" mode.

## Demo surface

`demo-react/src/components/slash-menu.tsx` is the reference UI: `Popover` + `Command`, `shouldFilter={false}`, controlled `value`, items grouped by `SlashItem.group`, and a local `ICONS` record mapping icon keys to `lucide-react` components.

`demo-react/src/components/bubble-toolbar.tsx` is the reference toolbar: a `Popover` anchored to `useBubbleToolbar().anchor`, `open` fully controlled by `toolbar.open` (no `onOpenChange` — visibility is entirely selection-driven), rendering one `Button` per item with `onMouseDown={(e) => e.preventDefault()}` so a click never blurs the editor before `item.run` fires.

`demo-react/src/components/block-handle.tsx` is the reference gutter: a hover group (insert-below + drag/click grip, both with `Tooltip`), the drop indicator, and a `DropdownMenu` (Duplicate/Delete) anchored at `menuAnchor` — all `position: fixed` or portal-rendered, positioned from `useBlockDrag`'s anchors, no markup in core. The dragged block's visual fade (`[data-dragging]` in `styles.css`) is a core-owned ProseMirror decoration, not a DOM mutation from the demo — PM's own view reconciliation strips foreign attributes set directly on its managed nodes.

`demo-react/src/components/nodes/*` are the M2 `NodeView`s, wired into `app.tsx`'s
`useSlashEditor({ blockKit: { image: false, …, extend: [Image.extend({ addNodeView: … }), …] } })`:
`uploadable-node-view.tsx` is the shared placeholder/progress/error chrome for `image`/`file`/`video`,
parameterized by an `accept` filter, an icon, and the bound `retry<Type>` command; `image-node-view.tsx`/
`file-node-view.tsx`/`video-node-view.tsx` are thin wrappers supplying the ready-state markup;
`embed-node-view.tsx` has no upload step — an empty node renders a URL input that calls
`updateAttributes({ url })` directly. `src/lib/upload-adapter.ts` is the playground's `UploadAdapter`:
resolves to a data URL after a simulated delay, rejecting once for a `fail-`-prefixed file name so the
retry affordance (and `tests/e2e/media-upload.spec.ts`) has a real error to recover from.

`demo-react/src/components/mention-menu.tsx` is the reference mention UI: `Popover` + `Command`,
the same `shouldFilter={false}`/controlled-`value` shape as `slash-menu.tsx`, plus a loading row for
`mention.loading`. `demo-react/src/components/link-editor-popover.tsx` renders `useLinkEditor`'s state:
an `Input` bound to `href`/`setHref` (Enter calls `confirm`), and, only when `editing`, "Open link"/
"Remove link" buttons — unlike the slash menu and bubble toolbar, this popover's input needs real DOM
focus to type a URL, so it does not pass `initialFocus={false}`.

`demo-react/src/lib/mention-provider.ts` (`mockMentionProvider`) filters a five-person in-memory
directory after a simulated delay — a real deployment would fetch from a user-search endpoint instead,
a distinction `Mention.items` (`(query, { signal }) => Promise<MentionItem[]>`) is agnostic to.

`demo-react/src/components/nodes/ai-block-node-view.tsx` is the `NodeView` for `AiBlock`, wired into
`app.tsx`'s `blockKit: { ai: { adapter: mockStreamAdapter, node: false }, extend: [AiBlock.extend({ addNodeView: … }), …] }`
— the same opt-out-and-`extend` seam M2 established, generalized to an opt-in node: renders the
streaming text with a spinner, then Keep (`acceptAiAction`)/Try again (`retryAiAction`)/Discard
(`discardAiAction`) once `status` settles. `demo-react/src/lib/stream-adapter.ts` (`mockStreamAdapter`)
yields a canned per-action response word by word after a simulated per-token delay; a context containing
`"trigger-ai-error"` fails once mid-stream, mirroring `mockUploadAdapter`'s `fail-`-prefixed names.
