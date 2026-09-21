# Milestones

Status legend: **Done** · **In progress** · **Not started**

| Milestone                         | Status         |
| --------------------------------- | -------------- |
| M0 — Foundation                   | ✅ Done        |
| M1 — Block UX                     | ✅ Done        |
| M2 — Media & structure            | ✅ Done        |
| M3 — Mentions & AI                | ✅ Done        |
| M4 — Collaboration                | ✅ Done        |
| Distribution — registry & release | ⬜ Not started |

---

## M0 — Foundation ✅

_Done when: `@slash-editor/core` and `/react` build and the demo renders a Tiptap document._

- [x] Bun workspaces; starter placeholders removed
- [x] `packages/core` + `packages/react` build via `vp pack` (ESM + d.mts)
- [x] `demo-react` app: Vite, React 19, Tailwind v4, StrictMode
- [x] shadcn initialized: Base UI (`base`), `nova` preset, lucide icons
- [x] `vp check` / `vp test` / build wired across the workspace
- [x] tsconfig scoping so declaration emit stays inside `dist/`

## M1 — Block UX ✅

_Done when: a user can build a Notion-style page with the keyboard alone; automated coverage for insert / reorder / nest._

- [x] **Slash menu** — `slashCommand` extension, ranked registry (`filterSlashItems`), keyboard state machine, code-block suppression, `onError` containment
- [x] **`useSlashMenu`** — store subscription via `useSyncExternalStore`, caret anchor, focus stays in the editor
- [x] **Menu surface** — shadcn `Command` inside an anchored `Popover`, mouse and keyboard parity
- [x] **Markdown input rules** — inherited from StarterKit (`# `, `- `, `> `, ``` )
- [x] **`BlockId` extension** — stable per-block ids, `data-block-id` / `data-block-type` rendering
- [x] **Block nodes** — callout, toggle (`details`), task list
- [x] **Drag handle** — hover target, block reorder, list nest/unnest
- [x] **Bubble toolbar** — selection-anchored inline formatting
- [x] **Browser-driven regression coverage** — Playwright in `demo-react` (`bun run test:e2e`): slash insert, gutter-handle reorder, drag-to-nest, paste normalization from representative Notion and Google Docs HTML

## M2 — Media & structure ✅

_Done when: the upload adapter contract is documented and the failure/retry path is verified end to end._

- [x] `UploadAdapter` contract (`status: uploading | ready | error`, retry command) — `UploadAdapter`,
      `runUpload`/`retryUpload` orchestration, `PendingUploadRegistry` (the picked `File` never touches
      doc attrs — it lives in per-node storage keyed by `BlockId`, so retry resends without re-picking)
- [x] Image, file, video nodes — `Image`/`File`/`Video`, each with `setX`/`retryX` commands, an empty
      placeholder state, and `status`/`error` living in doc attrs so completion re-renders through the
      normal transaction pipeline, not a separate subscribe channel
- [x] Embed node (bookmark / iframe) — `Embed`, direct `url`/`mode` attrs, no adapter (nothing async)
- [x] Tables — `TableKit` from `@tiptap/extension-table`, resizable columns on by default
- [x] Columns (container node, first non-list nesting surface) — `Columns`/`Column`,
      `content: "column{2,}"` bakes the two-column floor into the schema itself

_Landed:_ each M2 node is `false`-opt-out-able from `createBlockKit` like M1's `slash`/`blockId`/`drag`
seams, so a host can supply a `NodeView`-augmented variant via `extend` without a duplicate schema
registration (`Image.extend({ addNodeView: () => ReactNodeViewRenderer(...) })` — see `demo-react`'s
`app.tsx` and `src/components/nodes/*`); slash items for all six nodes; Playwright coverage
(`media-upload.spec.ts`, `structure.spec.ts`) exercising the real upload → error → retry → ready
transition against a mock `UploadAdapter`, plus table/columns/embed insertion.

## M3 — Mentions & AI ✅

_Done when: the demo works against a local mock endpoint with no vendor SDK in the dependency graph._

- [x] `@`-mentions with async provider
- [x] Inline link editing UI
- [x] AI slash actions over a `StreamAdapter` (bring-your-own SSE endpoint)

_Landed:_ `Mention` node built on `@tiptap/suggestion`'s native async `items`/`debounce`/
`minQueryLength`/abort support — mirrors `SlashCommand`'s storage/keyboard shape plus a `loading` flag
the (always-synchronous) slash registry never needs; opt-in via `mention: { items }` on `createBlockKit`
since there is no default provider. `LinkEditor` extension owns only popover visibility and the draft
href — applying/removing a link calls the `link` mark's own `setLink`/`unsetLink` directly, the same way
a `BubbleToolbarItem` calls `toggleBold`; auto-opens (`editing: true`) whenever the cursor lands inside
an existing link (`StarterKit`'s `link` now configured `openOnClick: false, enableClickSelection: true`),
and a new "Link" bubble-toolbar item opens it (`editing: false`) over a fresh text selection. `AiBlock`
transient node + `StreamAdapter` contract (`stream(request, context): AsyncIterable<string>`) +
`PendingAiRegistry` (kept on success, unlike uploads, so "try again" always has the last request to
replay) + four default AI slash actions (`continue-writing`/`summarize`/`brainstorm-ideas`/
`fix-spelling-grammar`, each operating on the document text up to the trigger — a slash command never
carries a real text selection) via `createAiSlashItems`; `runAiAction`/`retryAiAction`/`acceptAiAction`/
`discardAiAction` commands, opt-in via `ai: { adapter }` with a `node: false` sub-option mirroring M2's
opt-out-and-`extend` seam for a host-supplied `NodeView`. Playwright coverage (`mention.spec.ts`,
`link-editor.spec.ts`, `ai-actions.spec.ts`) exercising the real async search, click-to-edit/remove, and
stream → error → retry → keep/discard transitions against mock providers.

## M4 — Collaboration ✅

_Done when: two browsers converge on concurrent edits across every custom node and reconnect cleanly after offline edits._

- [x] Yjs + `y-prosemirror` wiring, `history: false` path exercised
- [x] Hocuspocus self-host recipe
- [x] Presence cursors
- [x] Comment mark + external thread store adapter

_Landed:_ `collaboration()` (`packages/core/src/collaboration.ts`) wraps Tiptap's official
`Collaboration`/`CollaborationCaret` extensions (themselves a thin layer over `y-prosemirror` via
`@tiptap/y-tiptap`) — `BlockId`'s `"y-sync$"` remote-skip check, anticipated since M1, needed no
changes. `createBlockKit({ collaboration })` is opt-in like `mention`/`ai` (no default `Y.Doc`) and
forces `undoRedo: false` on `StarterKit` whenever it's set, regardless of the `history` option — Yjs
owns the undo stack once a document is shared. Presence carets render through a custom
`render`/`selectionRender` pair emitting `data-collab-caret`/`data-collab-selection` instead of the
upstream extension's default class names, keeping core's no-class-names rule; `yjs` is a peer
dependency of both `core` and `react` (host owns the single `Y.Doc`/`Awareness` instance, the same
rule as `@tiptap/pm`). `Comment` (`comment.ts`) is a mark (`threadId` only, `excludes: ""` so distinct
threads can anchor overlapping ranges) plus a pure `activeThreadIds(state)` helper and a
`CommentThreadStore` contract — thread bodies, authors, and resolved state live entirely outside the
document, called from React (`useComments`), never from core itself, mirroring how `useLinkEditor`
composes core's popover state with the `link` mark's own commands. `usePresence` (`@slash-editor/react`)
reads connected peers off any awareness-shaped provider for chrome outside the editor (an avatar row),
independent of `CollaborationCaret`'s in-document carets. `demo-react`'s self-host recipe
(`server/collab-server.ts`) bridges Hocuspocus's runtime-agnostic `Hocuspocus` class to `Bun.serve` via
`crossws`'s Bun adapter — `@hocuspocus/server`'s convenience `Server` class assumes Node's `node:http`
and refuses to run under Bun; `src/lib/collaboration.ts` wires a `HocuspocusProvider` into a `?collab=
<room>` opt-in path (`CollabApp` in `app.tsx`), kept entirely separate from the default single-user
`SoloApp` so no existing spec ever opens a websocket. Playwright coverage (`collab.spec.ts`): two
browser contexts converge on concurrent edits, one going offline mid-edit via `context.setOffline`
and reconnecting cleanly; a single-page comment flow anchors a thread over a selection and resolves it
through the mock `CommentThreadStore`.

## Distribution ⬜

_Done when: `shadcn add` installs the menu into a scratch Vite and Next app and both type-check and build._

- [ ] shadcn registry items for the editor components (`/r/[name].json`)
- [ ] Docs site built from `demo-react` with live examples
- [ ] Release flow (`bumpp`, `0.x` lockstep versioning for core + react)

---

## Deferred decisions

| Decision                                           | Current stance                          | Revisit when                                  |
| -------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Universal block nesting (`blockContainer` wrapper) | Rejected; container nodes instead       | Users demand arbitrary block-in-block nesting |
| Markdown as canonical format                       | Rejected; ProseMirror JSON is canonical | A portability requirement appears             |
| Comment bodies inside the document                 | Rejected; external thread store         | M4 design review                              |
