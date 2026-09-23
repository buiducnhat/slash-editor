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

| Option          | Default                                   | Effect                                                                   |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `headingLevels` | `[1, 2, 3]`                               | Levels offered by the heading extension                                  |
| `history`       | `true`                                    | `false` drops `undoRedo`; forced `false` whenever `collaboration` is set |
| `slash`         | `{ char: "/", items: defaultSlashItems }` | `false` leaves the trigger character inert                               |
| `blockId`       | `{ types: "auto" }`                       | `false` opts out; drag targeting and comment anchoring need it           |
| `drag`          | `{}`                                      | `false` opts out of the gutter handle                                    |
| `collaboration` | none (opt-in)                             | Shared `Y.Doc`/provider/user; see Collaboration below                    |
| `comment`       | `{}`                                      | `false` opts out of the `comment` mark                                   |
| `extend`        | `[]`                                      | Extensions appended last, so they win conflicting keymaps                |

StarterKit is tuned where a default fights the block model: `blockquote` is off (`quote()` re-registers it with the `"` shorthand, freeing `>` for the toggle) and `gapcursor` is off, so clicking the empty strip a margin leaves next to an isolated block focuses the nearest line instead of a gap cursor that turns the next keystroke into a new block.

## Document model

Canonical format is the Tiptap/ProseMirror JSON document — no parallel block model, no conversion layer.

Nesting uses **container nodes** (lists today; `details`, `callout`, `columns` planned), not a universal `blockContainer` wrapper. A wrapper schema would give uniform nesting but breaks third-party extension expectations, complicates markdown serialization, and doubles the Yjs node count.

Rules that keep Yjs integration safe, enforced from day one and still binding now that `collaboration` is real:

- No non-deterministic defaults in node attributes.
- Identity attributes are generated on insert/parse, never during render, and never regenerated on update.

## Block identity

`BlockId` injects `attrs.id` (12 chars, a 64-symbol alphabet) into every node whose `group` or `content` expression contains `block` — resolved the same way `getSchemaByResolvedExtensions` resolves those fields, via `getExtensionField`/`callOrReturn`, so function-valued extensions agree with the schema. `"auto"` deliberately includes nested nodes (a paragraph inside a list item gets its own id), since comment anchoring needs identity at every level, not just at drag units.

Assignment is two-staged, because `addGlobalAttributes` runs during schema construction — before Tiptap's per-editor storage snapshot exists — so it cannot hand data to later hooks through `this.storage`:

- `onCreate` back-fills the whole document once, dispatched with `addToHistory: false`.
- An `appendTransaction` plugin re-derives the type set from `editor.schema` on every doc-changing transaction, assigns ids to nodes missing one, and regenerates any id that now appears more than once (a pasted duplicate) — scoped to the transaction's changed ranges via `getChangedRanges`.
- Both skip a transaction carrying `BLOCK_ID_REMOTE_META`, or the literal `"y-sync$"` meta key a `PluginKey("y-sync")` resolves to on its first construction — recognized without a `y-prosemirror` dependency at M1.

## Block drag

`BlockDrag` resolves both hover and drop targets from cached block rects (`computeRects`, invalidated on transaction), not `view.posAtCoords`: the gutter and a block's own left padding are empty space with no caret position, where `posAtCoords` reliably returns nothing, dropping the hover the instant the pointer left the text and entered the gutter it was heading for. Hover picks the smallest rect whose vertical range contains the pointer, so a list item wins over its enclosing list. Not HTML5 DnD; drives its own storage/subscribe pair (`editor.storage.blockDrag`, mirroring `SlashCommandStorage`). A drag unit is a direct doc child, a `listItem` at any depth, or a block inside a toggle's body (`detailsContent`) — deeper nodes resolve outward to one of those, so dragging a paragraph inside a list item moves the whole row.

The gutter itself is anchored by `BlockTarget.getClientRect`, which reports the block's _first line_ rather than its box: a `Range` over the block's first text node, so top padding (callout, code block, table cell) is accounted for, falling back to the block's own line box for a block with no text (a rule, a ready image). A tall block — an expanded toggle, a table, a multi-line column — therefore keeps its hover controls at the top instead of centring them on its height.

`resolveDropTarget` is pure geometry (before/after by nearest-midpoint, `inside` when rightward travel passes `indentThreshold`) parameterized by two schema predicates the plugin supplies:

- `canNest(source, target)` — checks `target.contentMatchAt(target.childCount)`, the state _after_ the target's existing children, not `target.contentMatch` (the state before any). `listItem`'s content is `"paragraph block*"`: the naive start-state check rejects everything, since only `paragraph` can open it, while a later block appends validly.
- `canPlaceBeside(source, target)` — whether `source` can sit as `target`'s sibling at all (e.g. a paragraph cannot be a direct sibling of a `listItem` inside a `bulletList`). When false, the drop falls back to before/after `target`'s enclosing top-level container (`BlockRect.containerPos`/`containerSize`) instead of splitting the list.

`moveBlock`/`moveBlockUp`/`moveBlockDown` share one `delete` + `insert` transaction, so every move — drag or `Alt-Shift-ArrowUp/Down` — is one undo step and the moved node's `id` rides along unchanged. `duplicateBlock`/`deleteBlock` round out the set for the gutter's click-menu.

The dragged block's `data-dragging` marker is a `props.decorations` entry on the same plugin, not a DOM attribute set from React: ProseMirror's own view reconciliation strips foreign attributes it didn't render, so anything mutating its managed nodes directly gets silently reverted on the next `updateState`. Since drag state lives in `storage`, outside the transaction pipeline, `setDragging` dispatches a no-op transaction (`addToHistory: false`) purely to force `updateState` — and with it, a decoration recompute.

Click vs. drag on the grip is resolved entirely in `useBlockDrag` (react): a press under 4px of movement sets `menuTarget` instead of calling `storage.setDragging`, opening the demo's Duplicate/Delete menu. This is DOM gesture disambiguation, not editor state, so it never touches core.

## Media uploads

`image`/`file`/`video` share one shape (`packages/core/src/upload.ts`): a node's `status`/`error`
live in doc attrs — part of the document, so a completed or failed upload re-renders through the
normal transaction pipeline, unlike the slash menu/bubble toolbar/block drag, which track ephemeral
UI state through their own `storage.subscribe` pair instead. `setImage`/`setFile`/`setVideo` with no
options insert an empty placeholder; with `{ file, adapter }` they insert `status: "uploading"` and
kick off `adapter.upload()` in a microtask, so the async work starts strictly after the insert
transaction has dispatched. `retryImage`/`retryFile`/`retryVideo` do the same deferral — dispatching
their own "now uploading" transaction synchronously, from inside the very command Tiptap's own
pipeline is still assembling a transaction for, throws `RangeError: Applying a mismatched
transaction` once that pipeline's dispatch lands on top of it.

The picked `File` never touches node attrs: attrs must stay JSON-serializable for Yjs, so it
lives in `PendingUploadRegistry`, a per-node-type map keyed by the node's `BlockId`. Retry resends
that same `File` — or, via `retryImage(id, { file, adapter })`, a fresh one, the same path a
`NodeView` uses to attach a file to a placeholder that has never had an upload attempt.

`embed` has no upload step: nothing async, so its `NodeView` sets `url` directly through
`updateAttributes` (built into every Tiptap `NodeView`), no adapter or retry contract involved.

## Overriding a node's rendering

Tiptap does not deduplicate two extensions sharing a name — both register, and the schema warns
about (and effectively breaks on) the collision. So a host that wants a `NodeView` for `image` (or
`file`/`video`/`embed`) does not add a second `Image`; it opts the baseline one out
(`blockKit: { image: false }`) and appends its own `Image.extend({ addNodeView: () => … })` through
`extend`, the same single-registration path M1 established for `slash`/`blockId`/`drag`/
`bubbleToolbar`'s `false` seam. `site/components/playground/playground-editor.tsx` does this for all four upload-capable/embed
nodes, rendering React `NodeView`s from `site/registry/components/nodes/*` via `ReactNodeViewRenderer` —
`table`/`columns` have no such override; their default rendering is interactive enough on its own.

## Collaboration

`collaboration()` (`packages/core/src/collaboration.ts`) wraps Tiptap's official `Collaboration`/
`CollaborationCaret` extensions — themselves a thin layer over `y-prosemirror` via `@tiptap/y-tiptap` —
rather than driving `y-prosemirror` by hand: `BlockId`'s `"y-sync$"` remote-skip check (anticipated
since M1) already recognizes the transaction meta these extensions set, so no core wiring changed to
adopt it. `createBlockKit({ collaboration })` is opt-in like `mention`/`ai` — there is no default
`Y.Doc` — and forces `undoRedo: false` on `StarterKit` whenever it's set, regardless of the `history`
option: Yjs owns the undo stack once a document is shared, and running both corrupts it.

`yjs` is a peer dependency of both `core` and `react`, the same rule as `@tiptap/core`/`@tiptap/pm`:
two copies of `yjs` in one app produce `instanceof Y.Doc`-style mismatches. The host creates the
`Y.Doc` and any network provider (`HocuspocusProvider`, `WebrtcProvider`, …) and owns their
lifecycle; `collaboration()` only ever receives them through options.

Presence carets render through a custom `render`/`selectionRender` pair emitting
`data-collab-caret`/`data-collab-caret-label`/`data-collab-selection` attributes, not the upstream
extension's default `collaboration-carets__*` class names — keeping the "core emits no class names"
rule intact for a vendored extension the same way it holds for hand-written ones.
`@slash-editor/react`'s `usePresence` is a separate, editor-independent hook: it reads a provider's
awareness states directly for chrome outside the document (an avatar row), duck-typed against the same
awareness shape `collaboration()`'s `CollaborationProvider` option accepts so this package never
depends on `yjs`/`y-protocols` types.

The deployed playground's `?collab=<room>` opt-in path (`CollabEditor` in
`playground-editor.tsx`) runs `y-webrtc`'s `WebrtcProvider` — peer-to-peer, no document server —
signaling through `app/api/signaling/route.ts`, a Vercel WebSocket Function since serverless
functions can't host the long-lived process a document server needs. `site`'s Hocuspocus recipe
(`server/collab-server.ts`, bridging Hocuspocus's runtime-agnostic `Hocuspocus` class to
`Bun.serve` via `crossws`'s Bun adapter — `@hocuspocus/server`'s convenience `Server` class
assumes Node's `node:http` and throws if it detects the `Bun` global) stays documented as the
centralized-server alternative; see [Collaboration](/docs/guides/collaboration) for when to
reach for which. `CollabEditor` is a separate component from the default `SoloEditor`, so no
existing spec ever opens a websocket, and `Y.Doc`/provider creation is guarded by a ref
(`collabRef.current ??= …`, mirroring `useSlashEditor`'s own extension-latching guard) rather
than torn down on unmount — like any other browser tab leaving a room, the connection closes
when the page does.

## Comments

`Comment` (`comment.ts`) is a mark, not a node: `threadId` is its only attribute, and `excludes: ""`
opts out of ProseMirror's default same-type exclusion so distinct threads can anchor overlapping
ranges. Because comment marks are ordinary document content, `collaboration()` syncs them for free —
no comment-specific Yjs wiring exists or is needed. Thread bodies, authors, and resolved/open state
never enter the document: a host-provided `CommentThreadStore` (`createThread`/`addMessage`/
`resolveThread`/`reopenThread`/`getThread`/`listThreads`) owns all of that, the same "anchor in core,
body outside" split `UploadAdapter`/`StreamAdapter` use for binary/model work.

`unsetComment(threadId)` cannot use ProseMirror's built-in `unsetMark(from, to, markType)`, which
strips every mark of that type regardless of attrs — removing one thread's anchor would also remove
every other thread anchored on the same range. It instead calls `tr.removeMark(from, to, mark)` with a
concrete `Mark` instance (type + `threadId`), which ProseMirror matches by `mark.eq()`.

`activeThreadIds(state)` — the distinct thread ids anchored under the current selection — is a pure
function over a bare `EditorState`, testable without a DOM the same way `resolveDropTarget` and
`filterSlashItems` are. `@slash-editor/react`'s `useComments` composes it with a `CommentThreadStore`:
`addComment` awaits `store.createThread` before calling `setComment(thread.id)`, the same
deferred-then-chain shape `useLinkEditor.confirm` uses for the `link` mark's own commands — core never
calls `CommentThreadStore` itself.

## Markdown

Markdown is an import/export format only; the document stays ProseMirror JSON. Tiptap's
`MarkdownManager` walks the doc calling each node's `renderMarkdown`, and parses through `marked`
with each node's `markdownTokenizer`/`parseMarkdown` — so every node owns its syntax in its own
file, and a new node (first- or third-party, via `extend`) brings its own without anything central
changing. The hooks live in the main entry through the dependency-free `markdown-syntax.ts`; only
`@slash-editor/core/markdown` imports `@tiptap/markdown`/`marked`, keeping ~20 KB gzipped out of
bundles that never opt in.

Three constraints shape it:

- **No DOM on import.** Without `window.DOMParser`, `MarkdownManager` turns raw HTML into literal
  text, so `<details>` and every `<!-- slash:… -->` marker are read by a tokenizer, never by the
  HTML fallback. A catch-all tokenizer (registered first, so `marked` tries it last) swallows any
  marker no node claimed, leaving the block after it as plain markdown.
- **Separators outlive empty renders.** A container joins children with `\n\n` even when one
  renders `""`, and the extra blank lines re-import as an empty paragraph. Nodes with nothing
  durable to write (`aiBlock`, an upload without a URL) declare `excludeFromMarkdown` and are
  pruned from the JSON before serializing.
- **`marked` is a global.** The upstream manager registers tokenizers into the `marked` singleton —
  another copy per editor, and a host app's own `marked` would start reading `> [!NOTE]` as a
  callout. `SlashMarkdownManager` defaults to a fresh `Marked` instance per manager (per editor, and
  per cached `extensions` array for the pure helpers).

## Lifecycle decisions in `useSlashEditor`

- `immediatelyRender: false` — the same component renders under SSR (Next.js App Router) without hydration mismatch.
- Extensions are resolved **once per editor instance** and latched in a ref. ProseMirror cannot swap a schema on a live document, so later changes to `blockKit`/`extensions` are ignored rather than half-applied.
- React 19 StrictMode double-mounts; `@tiptap/react` handles teardown, and the demo keeps StrictMode on so a remount-unsafe change fails loudly in development.

## Styling seam

Core never emits class names. The demo styles content through `.slash-content` element selectors in `site/registry/slash-content.css`, and menu surfaces come from shadcn components using semantic tokens (`bg-popover`, `text-muted-foreground`). `data-block-type` / `data-block-id` render on every block-capable node via `BlockId`; the drag gutter and drop indicator are `position: fixed` overlays positioned from `useBlockDrag`'s anchors, entirely outside the editor DOM.
