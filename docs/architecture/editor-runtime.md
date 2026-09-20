# Editor Runtime

How a live editor instance is assembled, and the schema decisions baked into it.

## Composition

```
createBlockKit(options)            → Extensions[]   (core)
      │  StarterKit.configure(...) + slashCommand(...) + blockId(...) + blockDrag(...) + extend
      ▼
useSlashEditor(options)            → Editor | null  (react)
      │  immediatelyRender: false, extensions latched once
      ▼
<EditorContent editor={editor} />                   (app)
```

`createBlockKit()` returns `[StarterKit, SlashCommand, BlockId, BlockDrag, ...extend]`. Options:

| Option          | Default                                   | Effect                                                              |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `headingLevels` | `[1, 2, 3]`                               | Levels offered by the heading extension                             |
| `history`       | `true`                                    | `false` drops `undoRedo`; required once a Yjs provider owns history |
| `slash`         | `{ char: "/", items: defaultSlashItems }` | `false` leaves the trigger character inert                          |
| `blockId`       | `{ types: "auto" }`                       | `false` opts out; drag targeting and comments (M4) need it          |
| `drag`          | `{}`                                      | `false` opts out of the gutter handle                               |
| `extend`        | `[]`                                      | Extensions appended last, so they win conflicting keymaps           |

## Document model

Canonical format is the Tiptap/ProseMirror JSON document — no parallel block model, no conversion layer.

Nesting uses **container nodes** (lists today; `details`, `callout`, `columns` planned), not a universal `blockContainer` wrapper. A wrapper schema would give uniform nesting but breaks third-party extension expectations, complicates markdown serialization, and doubles the Yjs node count.

Rules that keep the future Yjs integration (M4) safe, enforced from day one:

- No non-deterministic defaults in node attributes.
- Identity attributes are generated on insert/parse, never during render, and never regenerated on update.

## Block identity

`BlockId` injects `attrs.id` (12 chars, a 64-symbol alphabet) into every node whose `group` or `content` expression contains `block` — resolved the same way `getSchemaByResolvedExtensions` resolves those fields, via `getExtensionField`/`callOrReturn`, so function-valued extensions agree with the schema. `"auto"` deliberately includes nested nodes (a paragraph inside a list item gets its own id), since comment anchoring and block permissions (M4) need identity at every level, not just at drag units.

Assignment is two-staged, because `addGlobalAttributes` runs during schema construction — before Tiptap's per-editor storage snapshot exists — so it cannot hand data to later hooks through `this.storage`:

- `onCreate` back-fills the whole document once, dispatched with `addToHistory: false`.
- An `appendTransaction` plugin re-derives the type set from `editor.schema` on every doc-changing transaction, assigns ids to nodes missing one, and regenerates any id that now appears more than once (a pasted duplicate) — scoped to the transaction's changed ranges via `getChangedRanges`.
- Both skip a transaction carrying `BLOCK_ID_REMOTE_META`, or the literal `"y-sync$"` meta key a `PluginKey("y-sync")` resolves to on its first construction — recognized without a `y-prosemirror` dependency at M1.

## Block drag

`BlockDrag` resolves both hover and drop targets from cached block rects (`computeRects`, invalidated on transaction), not `view.posAtCoords`: the gutter and a block's own left padding are empty space with no caret position, where `posAtCoords` reliably returns nothing, dropping the hover the instant the pointer left the text and entered the gutter it was heading for. Hover picks the smallest rect whose vertical range contains the pointer, so a list item wins over its enclosing list. Not HTML5 DnD; drives its own storage/subscribe pair (`editor.storage.blockDrag`, mirroring `SlashCommandStorage`). A drag unit is a direct doc child or a `listItem` at any depth — deeper nodes resolve outward to one of those two, so dragging a paragraph inside a list item moves the whole row.

`resolveDropTarget` is pure geometry (before/after by nearest-midpoint, `inside` when rightward travel passes `indentThreshold`) parameterized by two schema predicates the plugin supplies:

- `canNest(source, target)` — checks `target.contentMatchAt(target.childCount)`, the state _after_ the target's existing children, not `target.contentMatch` (the state before any). `listItem`'s content is `"paragraph block*"`: the naive start-state check rejects everything, since only `paragraph` can open it, while a later block appends validly.
- `canPlaceBeside(source, target)` — whether `source` can sit as `target`'s sibling at all (e.g. a paragraph cannot be a direct sibling of a `listItem` inside a `bulletList`). When false, the drop falls back to before/after `target`'s enclosing top-level container (`BlockRect.containerPos`/`containerSize`) instead of splitting the list.

`moveBlock`/`moveBlockUp`/`moveBlockDown` share one `delete` + `insert` transaction, so every move — drag or `Alt-Shift-ArrowUp/Down` — is one undo step and the moved node's `id` rides along unchanged. `duplicateBlock`/`deleteBlock` round out the set for the gutter's click-menu.

The dragged block's `data-dragging` marker is a `props.decorations` entry on the same plugin, not a DOM attribute set from React: ProseMirror's own view reconciliation strips foreign attributes it didn't render, so anything mutating its managed nodes directly gets silently reverted on the next `updateState`. Since drag state lives in `storage`, outside the transaction pipeline, `setDragging` dispatches a no-op transaction (`addToHistory: false`) purely to force `updateState` — and with it, a decoration recompute.

Click vs. drag on the grip is resolved entirely in `useBlockDrag` (react): a press under 4px of movement sets `menuTarget` instead of calling `storage.setDragging`, opening the demo's Duplicate/Delete menu. This is DOM gesture disambiguation, not editor state, so it never touches core.

## Lifecycle decisions in `useSlashEditor`

- `immediatelyRender: false` — the same component renders under SSR (Next.js App Router) without hydration mismatch.
- Extensions are resolved **once per editor instance** and latched in a ref. ProseMirror cannot swap a schema on a live document, so later changes to `blockKit`/`extensions` are ignored rather than half-applied.
- React 19 StrictMode double-mounts; `@tiptap/react` handles teardown, and the demo keeps StrictMode on so a remount-unsafe change fails loudly in development.

## Styling seam

Core never emits class names. The demo styles content through `.slash-content` element selectors in `demo-react/src/styles.css`, and menu surfaces come from shadcn components using semantic tokens (`bg-popover`, `text-muted-foreground`). `data-block-type` / `data-block-id` render on every block-capable node via `BlockId`; the drag gutter and drop indicator are `position: fixed` overlays positioned from `useBlockDrag`'s anchors, entirely outside the editor DOM.
