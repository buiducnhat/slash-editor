# Milestones

Status legend: **Done** · **In progress** · **Not started**

| Milestone              | Status  |
| ---------------------- | ------- |
| M0 — Foundation        | ✅ Done |
| M1 — Block UX          | ✅ Done |
| M2 — Media & structure | ✅ Done |
| M3 — Mentions & AI     | ✅ Done |
| M4 — Collaboration     | ✅ Done |
| M5 — Distribution      | ✅ Done |

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

## M5 — Distribution ✅

_Done when: `shadcn add` installs the menu into a scratch Vite and Next app and both type-check and build._

- [x] shadcn registry: `demo-react/registry.json`, granular `registry:component` items per editor UI
      piece plus a `slash-editor-kit` umbrella `registry:block`, built via `shadcn build` into
      `public/r/*.json`
- [x] Docs site built into `demo-react` (`/docs` overview, `/docs/:item` live pages), no new
      framework dependency
- [x] Release flow: lockstep `bumpp` (root + core + react), tag-triggered GitHub Actions publish

_Landed:_ `registry.json` ships 8 granular items plus the `slash-editor-kit` umbrella block; two of
the granular items (`popover`, `dropdown-menu`) are this repo's own anchor-aware `registry:ui`
overrides of the stock shadcn primitives — every surface that anchors off-element (caret, block
rect) depends on the `anchor` prop these add, so shipping the stock versions would silently break
the build (caught exactly by the acceptance test below). Cross-references between items in this
registry (the kit → its 8 members; several members → `popover`/`dropdown-menu`) use the
`@slash-editor/<name>` namespace, not bare names or raw URLs — shadcn resolves a bare
`registryDependencies` entry against the _default_ shadcn registry regardless of which registry
is asking, so a same-registry cross-reference needs either a namespace or a full URL; namespace
was chosen since it doesn't hardcode a deploy origin into `registry.json`. Consumers add one entry
to `components.json` (shown on `/docs`) before `shadcn add @slash-editor/<item>`.

`demo-react` is deployed to Vercel at <https://slash-editor-eta.vercel.app> (root `vercel.json`:
`cd demo-react && bun run registry:build && bun run build`, output `demo-react/dist`, SPA
rewrite to `index.html` for the pushState router) — the registry and docs site are genuinely
public, not just locally verified. `@slash-editor/core` and `@slash-editor/react` are published
on the real npm registry (`0.0.6` is `latest` for both). The full acceptance bar was re-verified
against these live artifacts, not a stand-in: a from-scratch Vite app installing the real npm
packages plus `shadcn add @slash-editor/slash-editor-kit` from the live Vercel-hosted registry,
type-checking and building clean.

The tag-triggered `.github/workflows/release.yml` (build → `vp check` → registry-schema gate →
publish) publishes with real `npm publish` (not `bun publish`, which has no OIDC support:
oven-sh/bun#22423, #24855 are both still open) authenticated via npm's OIDC Trusted Publishing —
no stored npm token. `bun pm pack` produces each tarball first, resolving `packages/react`'s
`workspace:*` dependency on core to a concrete version before npm (which has no notion of that
protocol) ever sees the manifest. Two bootstrap-era constraints, both one-time: npm Trusted
Publishing cannot register against a package that has never been published, so each package's
very first release needed one manual `npm publish` before its Trusted Publisher could be
configured on npmjs.com; and `bumpp` only commits the exact files it version-bumps, never a
lockfile a post-bump script touches, so `bun.lock`'s per-workspace version cache silently went
stale across three releases (`0.0.1`/`0.0.4`/`0.0.5`, each shipping `@slash-editor/react` pinned to a
`@slash-editor/core` version that was never published) before landing on the actual fix: the
`release` script's `bumpp` invocation runs `--execute "bun install"` _and_ `--all` (`git add
--all` before the commit), so the resynced lockfile is never left out of the release commit
again. The broken intermediate versions were unpublished; `0.0.6` is the first release built
with the fix and is `latest` for both packages.

---

## Deferred decisions

| Decision                                           | Current stance                          | Revisit when                                  |
| -------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Universal block nesting (`blockContainer` wrapper) | Rejected; container nodes instead       | Users demand arbitrary block-in-block nesting |
| Markdown as canonical format                       | Rejected; ProseMirror JSON is canonical | A portability requirement appears             |
| Comment bodies inside the document                 | Rejected; external thread store         | M4 design review                              |
