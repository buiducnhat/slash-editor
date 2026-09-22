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
| M6 — Docs site         | ✅ Done |
| M7 — Single app        | ✅ Done |

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
- [x] ~~Docs site built into `demo-react` (`/docs` overview, `/docs/:item` live pages), no new
      framework dependency~~ — superseded by M6: replaced with a dedicated Fumadocs/Next.js `site`
      workspace
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

## M6 — Docs site ✅

_Done when: `/docs` has MDX prose, generated navigation/search, live demos that import the real
registry components, and API tables generated from source — replacing the hand-rolled
`demo-react` routes from M5._

- [x] New `site` workspace: Next.js App Router + Fumadocs (`fumadocs-ui`/`core`/`mdx`), Tailwind
      v4, nova tokens shared with `demo-react` via `theme.css`/`slash-content.css`
- [x] Alias bridge: `site`'s `@/*` → `demo-react/src/*` (inverse of the usual convention), so
      registry components resolve verbatim with zero edits
- [x] `content/docs/**/*.mdx`: getting-started, one page per registry item + the kit, 7 guides,
      2 API reference pages — sidebar/TOC generated from the file tree, Cmd-K search built in
- [x] `<ComponentPreview>`: Preview/Code tabs per registry item, Code tab reading
      `demo-react/src/components/*` from disk so a demo can never drift from the shipped source
- [x] `<AutoTypeTable>` (`fumadocs-typescript`, Config API + persisted `.source/` types) generates
      prop tables from `packages/core`/`packages/react` source directly
- [x] Landing page: hero with a live `SlashMenuDemo`, feature grid, install snippet
- [x] `demo-react/src/routes/`, `lib/registry-items.ts`, `lib/router.tsx`,
      `components/install-command.tsx` deleted — `/docs` has one owner
- [x] `site/scripts/prebuild.ts`: builds the playground (`--base=/playground/`) and the shadcn
      registry, copies both into `site/public/`; `/playground` and `/r/:name.json` verified
      byte-identical in behavior against a real `next build`

_Landed:_ The registry and playground don't move — `/r/:name.json` (a hard constraint: published
`components.json` files already point at it) and `/playground` are pre-built static output
copied into `site/public/` by `site/scripts/prebuild.ts`, unchanged behavior. Every live demo
(`components/demo/registry-demos.tsx`) is wrapped `next/dynamic(..., { ssr: false })`
(`registry-demos.preview.tsx`) — a real ProseMirror `Editor` needs a DOM, and
`@slash-editor/react` touches DOM globals (`DOMRect`) at module scope, so SSR-ing any demo
throws. `site/source.config.ts` uses fumadocs-mdx's Config API rather than the Macro API used in
every upstream example: the Macro API's typed rewrite only exists inside a live
webpack/Turbopack bundle graph, so a standalone `tsc --noEmit` (this repo's `vp check` convention)
saw a generic, untyped `PageData` until collections were declared in `source.config.ts` and
consumed from the generated `.source/` output instead — the same "build artifacts before
typecheck" shape `packages/react` already requires of `packages/core`. Deploying requires one
manual step outside version control: the linked Vercel project's Root Directory must be set to
`site` for Next.js zero-config framework detection — not expressible in `vercel.json` for a
monorepo subdirectory app. Full design: [`project-pdr/docs-site-design-brief.md`](docs-site-design-brief.md),
topology: [`architecture/site-topology.md`](../architecture/site-topology.md).

## M7 — Single app ✅

_Done when: `demo-react` no longer exists — the playground is a native route inside `site`,
sharing its nav, theme, and build pipeline, and the registry component source lives inside
`site` directly._

- [x] Registry component source (`components/`, `lib/`, `theme.css`, `slash-content.css`) moved
      from `demo-react/src` into `site/registry/`, same internal structure — `@/*` now resolves
      locally instead of across a workspace boundary
- [x] `registry.json` + `components.json` moved into `site/`; `shadcn build` runs directly from
      `site` with no cross-workspace copy step
- [x] Playground rebuilt as `app/(home)/playground/page.tsx`: same `SoloEditor`/`CollabEditor`
      behavior, now under the shared `HomeLayout` nav (Docs/Playground/GitHub, search, theme
      toggle) instead of a bespoke `TopNav`
- [x] `?collab=<room>` gains a real join affordance (`RoomJoinForm`) instead of a raw query
      string being the only entry point; a "Leave room" control returns to the solo editor
- [x] `demo-react/server/collab-server.ts` moved to `site/server/collab-server.ts`;
      `site/package.json` gains `collab:server`
- [x] Playwright suite (13 spec files, `support.ts`) moved to `site/tests/e2e`;
      `playwright.config.ts` baseURL → `:3000`, every spec's `page.goto("/")` → `/playground`
- [x] `demo-react` directory deleted; root `package.json` workspaces/scripts, `tsconfig.json`
      include, `vite.config.ts` vitest excludes, `.gitignore`, and
      `.github/workflows/release.yml`'s registry-schema-validation step all repointed at `site`

_Landed:_ Two adaptations the straight file-move didn't cover: `lib/collaboration.ts` read
`import.meta.env.VITE_COLLAB_SERVER_URL` (Vite-only syntax, undefined under Next.js/Turbopack)
— fixed to `process.env.NEXT_PUBLIC_COLLAB_SERVER_URL`; and a stale `site/public/playground/`
directory from the old prebuild-copy step would have silently shadowed the new native route,
caught before it shipped. All 32 Playwright specs pass against the merged app, including the
two-browser collaboration test against the relocated `collab-server.ts` — the regression suite
never had to be weakened to land the merge. Full topology:
[`architecture/site-topology.md`](../architecture/site-topology.md).

---

## M8 — Live demo on Vercel ✅

_Done when: the deployed site's own `/playground?collab=<room>` mode is reachable by two
strangers on the public internet with no server of ours to run._

- [x] Vercel project's Root Directory/Framework repointed at `site` (was still `demo-react/dist`
      from before the M7 merge, so every deploy served a stale build)
- [x] Command menu selected-state CSS bug fixed (`data-selected:` is Tailwind v4's presence
      shorthand, not a value match; cmdk sets `data-selected="true"|"false"` literally, so every
      item rendered as selected) — `data-[selected=true]:`
- [x] `CollabEditor` surfaces real connection state (a status badge) instead of silently doing
      nothing when there's no reachable document server
- [x] Collaboration provider switched from `HocuspocusProvider` to `y-webrtc`'s
      `WebrtcProvider` — peer-to-peer, no document server to deploy at all; the
      `collaboration()` core extension needed no changes (duck-typed on `.awareness` already)
- [x] Signaling relay (`app/api/signaling/route.ts`) — a Vercel WebSocket Function, ported from
      `y-webrtc`'s own `bin/server.js` protocol — since `y-webrtc`'s default public signaling
      servers are dead (Heroku decommissioned the free dynos they ran on)

_Landed:_ Hocuspocus needs a long-lived process holding the document in memory — exactly what
Vercel's serverless functions don't provide, so the playground's collab mode was unreachable on
the deployed site even though it worked in every local/self-hosted context. `y-webrtc` sidesteps
that: peers connect directly to each other, and the only thing worth centralizing is signaling
(exchanging WebRTC connection setup, never document content), which fits a stateless WebSocket
relay. The Hocuspocus recipe (`server/collab-server.ts`) stays documented as the pattern for
apps that want a centralized server — nothing about it was wrong, it just can't run on this
deployment target. See [Collaboration](../../site/content/docs/guides/collaboration.mdx) for the
provider comparison and the signaling-server caveat (a WebSocket connection is pinned to one
Function instance; correct today, would need a shared pub/sub layer like Redis behind the same
protocol if peers start missing each other under heavier concurrent-room traffic).

---

## Deferred decisions

| Decision                                           | Current stance                          | Revisit when                                  |
| -------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Universal block nesting (`blockContainer` wrapper) | Rejected; container nodes instead       | Users demand arbitrary block-in-block nesting |
| Markdown as canonical format                       | Rejected; ProseMirror JSON is canonical | A portability requirement appears             |
| Comment bodies inside the document                 | Rejected; external thread store         | M4 design review                              |
