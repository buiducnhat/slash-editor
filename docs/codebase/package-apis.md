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
  extend?: Extensions;
}
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

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

`defaultSlashItems` ids: `paragraph`, `heading-1`, `heading-2`, `heading-3`, `bullet-list`, `ordered-list`, `blockquote`, `code-block`, `horizontal-rule` — all in group `"Basic blocks"`, each gated on schema presence via `when`.

The module augments `@tiptap/core`'s `Storage` interface so `editor.storage.slashCommand` is typed at every call site.

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
```

Re-exported from `@tiptap/react` so consumers need one import: `EditorContent`, `EditorContext`, `EditorProvider`, `useCurrentEditor`, `useEditorState`.

`useSlashMenu` and `useBlockDrag` are both safe with a `null` editor (closed state, no-op callbacks), which matters because `useSlashEditor` returns `null` on the first render.

`useBlockDrag`'s click-vs-drag disambiguation lives entirely in the hook (not core): a grip press that stays within 4px opens `menuTarget`; past that it calls `storage.setDragging`. It is pure DOM gesture handling, not editor state.

## Demo surface

`demo-react/src/components/slash-menu.tsx` is the reference UI: `Popover` + `Command`, `shouldFilter={false}`, controlled `value`, items grouped by `SlashItem.group`, and a local `ICONS` record mapping icon keys to `lucide-react` components.

`demo-react/src/components/block-handle.tsx` is the reference gutter: a hover group (insert-below + drag/click grip, both with `Tooltip`), the drop indicator, and a `DropdownMenu` (Duplicate/Delete) anchored at `menuAnchor` — all `position: fixed` or portal-rendered, positioned from `useBlockDrag`'s anchors, no markup in core. The dragged block's visual fade (`[data-dragging]` in `styles.css`) is a core-owned ProseMirror decoration, not a DOM mutation from the demo — PM's own view reconciliation strips foreign attributes set directly on its managed nodes.
