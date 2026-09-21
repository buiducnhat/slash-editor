# slash-editor — Design Brief

Status: accepted (brainstorm output) · Date: 2026-09-20

## 1. Foundation

### Problem

Notion-style block editing is commoditized at the _engine_ layer and scarce at the _UI_ layer:

| Layer                                                | State of the art | License                                                       |
| ---------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| Engine (ProseMirror/Tiptap)                          | Mature           | MIT                                                           |
| Extensions (drag handle, details, emoji, TOC, math…) | Mature           | MIT since mid-2025                                            |
| Collab transport (Yjs, y-prosemirror, Hocuspocus v4) | Mature           | MIT, self-hostable                                            |
| **Notion-grade block UI on shadcn/Tailwind**         | **Missing**      | Plate Plus €299/dev; Tiptap UI Components ship plain CSS/SCSS |
| Hosted collab / AI / comments service                | Tiptap Cloud     | Paid (not needed)                                             |

Existing free "tiptap + shadcn" projects are _toolbar-grade_: formatting buttons over a flat document. None deliver the block-level interaction model (slash insertion, hover drag handles, reordering, nesting, block comments) in shadcn tokens.

### Goals

- Notion-parity block UX, keyboard-first, accessible.
- shadcn/Tailwind native: only design tokens, no hardcoded colors, `cn()` composition, dark mode free.
- Users own the rendered markup (registry copy-paste) while behavior stays patchable (npm).
- 100% MIT dependency graph; self-hostable collaboration.

### Non-goals

- Hosted services (sync server, AI gateway, asset storage) — adapters only, bring-your-own backend.
- Non-React renderers in v1 (core stays framework-agnostic so this stays possible).
- DOCX/PDF fidelity, pagination, track changes.

### Architecture

```
packages/core     @slash-editor/core    Tiptap/PM extensions, node schemas, commands, serializers.
                                        deps: @tiptap/core, @tiptap/pm. No React, no CSS.
packages/react    @slash-editor/react   Headless React: provider, hooks, unstyled primitives (asChild).
                                        deps: core, @tiptap/react, @floating-ui/react.
registry/         shadcn registry       Styled components (Command, Popover, Button, …) users copy in.
demo-react/       playground + docs     Live demo, registry host (/r/[name].json), e2e target.
```

Rule of separation: **core computes, react coordinates, registry renders.** Core emits no class names — only `data-block-type`, `data-block-id`, and state attributes that Tailwind selectors target.

## 2. Technical Details

### Document model

Canonical format is the Tiptap/ProseMirror JSON doc. One addition: a `BlockId` extension injects `attrs.id` (nanoid, 12 chars) into every top-level-capable block node.

IDs are required for drag targeting, comment anchoring, block permissions, and stable Yjs identity. Generation rules (Yjs-safe from day one):

- Generated on **insert/parse**, never during render or `renderHTML`.
- Never regenerated on attribute update or remote change.
- No other non-deterministic defaults in any node attrs.

### Schema decision: nesting

**Flat ProseMirror-native document with nesting via container nodes**, not a universal `blockContainer` wrapper (BlockNote's approach).

A wrapper schema gives uniform nesting but breaks every third-party extension's node expectations, complicates markdown serde, and doubles Yjs node count. Container nodes cover real-world nesting: lists (native `liftListItem`/`sinkListItem`), `details` (toggle), `callout` (`content: block+`), `columns` (M2).

Revisit only if user feedback demands arbitrary block-in-block nesting.

### Node inventory

| Milestone | Nodes/marks                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| M1        | paragraph, heading 1-3, bulletList, orderedList, taskList, blockquote, codeBlock, horizontalRule, callout, details(toggle) |
| M2        | image, file, video, embed(bookmark/iframe), table, columns                                                                 |
| M3        | mention, link (inline), aiBlock (transient)                                                                                |
| M4        | comment mark, collaborationCursor                                                                                          |

### Slash command

Built on `@tiptap/suggestion`. Core owns the registry, filtering, ranking, and keyboard state machine; React exposes state; registry renders shadcn `Command` in a `Popover`.

```ts
// @slash-editor/core
export interface SlashItem {
  id: string;
  title: string;
  group: string;
  aliases?: string[];
  keywords?: string[];
  icon?: string; // icon *key*, resolved by the UI layer
  when?(ctx: SlashContext): boolean; // hide in code blocks, tables, read-only…
  run(ctx: SlashContext): void; // receives editor + range, deletes range itself
}

export function slashCommand(opts: {
  char?: string; // default '/'
  items: SlashItem[] | ((q: string) => SlashItem[] | Promise<SlashItem[]>);
  allowSpaces?: boolean;
}): Extension;

export const defaultSlashItems: SlashItem[];
export function createBlockKit(options?: BlockKitOptions): Extension[];
export function serializeMarkdown(doc: JSONContent): string;
export function parseMarkdown(md: string): JSONContent;
```

```ts
// @slash-editor/react
export function useSlashEditor(opts: UseSlashEditorOptions): Editor;
export function useSlashMenu(editor: Editor): {
  open: boolean;
  query: string;
  items: SlashItem[];
  activeIndex: number;
  select(index?: number): void;
  close(): void;
  refs: FloatingRefs;
};
export function useBlockDrag(editor: Editor): {
  handleRef;
  dragging: BlockRef | null;
  dropTarget: DropTarget | null;
};
export const SlashEditorProvider, EditorContent, BubbleToolbar, DragHandle; // all headless, asChild
```

Every filter/rank/keyboard path is testable in Node without a DOM.

### Error handling

- **Unknown node type** (schema drift, older/newer content): fall back to an `unknownBlock` node that preserves the original JSON in attrs and renders a neutral placeholder. Never throw, never drop user content.
- **Upload/embed failure**: node attrs carry `status: 'uploading' | 'ready' | 'error'` + `error`; UI offers retry via a command. No optimistic deletion.
- **Slash item `run` throws**: caught at the extension boundary, surfaced through `onError(err, ctx)` option; the transaction is rolled back so the doc never lands half-mutated.
- **Async item providers** reject → menu shows empty state, logs once, does not close.

### Edge cases (explicit test targets)

- IME composition: slash menu must not open or filter while `event.isComposing`.
- Mobile: bubble toolbar positioned against `visualViewport`, not `window`; drag handles hidden below `md`, replaced by long-press block menu.
- Paste normalization: HTML from Notion / Google Docs / VS Code → block mapping table; unknown wrappers unwrapped rather than nested.
- SSR (Next.js App Router): `immediatelyRender: false`, no `window` access at module scope in core.
- React 19 StrictMode double-mount must not destroy a live editor instance (guard in `useSlashEditor`).
- Undo grouping across node views (upload completion must not be a separate undo step).
- Empty-doc and trailing-node behavior: always one trailing paragraph to click into.

### Comments design (M4)

Comment anchors are a PM mark `comment { threadId }`; thread bodies live **outside** the document in a host-provided store. Deleting text removes anchors but never loses threads; orphan threads resolve to "resolved/detached" in UI. Rendering via decorations, so comment state never dirties the doc.

### Distribution design (M5)

Registry authoring follows shadcn's own `registry.json` + `shadcn build` convention (not a
hand-rolled generator): a root `demo-react/registry.json` declares one `registry:component` item
per editor UI piece (`slash-menu`, `bubble-toolbar`, `block-handle`, `mention-menu`,
`link-editor-popover`, `comment-panel`, `presence-avatars`, `node-views`), each with
`registryDependencies` on the shadcn primitives it imports (`command`, `tooltip`, `input`,
`textarea`, `separator`, `button`, and this repo's own `@slash-editor/popover`/
`@slash-editor/dropdown-menu` — see below) so `shadcn add` installs both in one command, and
`dependencies` on `@slash-editor/core`/`@slash-editor/react`. One umbrella `registry:block`
(`slash-editor-kit`) `registryDependencies`-references every component item, namespaced
(`@slash-editor/<item>`) rather than by bare name, for a single-command full install; individual
items stay installable on their own. `shadcn build` emits `public/r/*.json`, served as static
assets by the same Vite app that hosts the docs — schema correctness is enforced by the build
command itself failing closed in CI, not a second validator. Node-view example files distributed
this way must not import the demo's mock adapters directly (`UploadableNodeView` takes `adapter`
as a prop, set by the per-type wrapper) — a registry consumer must never receive a hardcoded
data-URL mock upload path.

Two shadcn primitives are patched in this repo (`popover.tsx`/`dropdown-menu.tsx` forward an
`anchor` prop to their `Positioner`, so a surface can anchor to the caret or a block's rect
instead of a trigger element — see `code-standard/ui-conventions.md`) and every anchored surface
depends on that prop. Shipping the _stock_ shadcn `popover`/`dropdown-menu` would type-check-fail
at the consumer's build, silently and only there — caught during scratch-app verification, not by
any check inside this repo, since our own `demo-react` already has the patched files. Fixed by
publishing `popover`/`dropdown-menu` as our own `registry:ui` items and referencing them, from
every item that needs them, via the `@slash-editor/<name>` namespace — never a bare name. This
also surfaced the general rule: a bare `registryDependencies` entry (`"button"`) always resolves
against the _default_ shadcn registry, never self-referentially against the registry the
referencing item came from, regardless of nesting. Cross-references within this registry — the kit
referencing its 8 members, several members referencing `popover`/`dropdown-menu` — therefore all
use the `@slash-editor/<name>` namespace, resolved via a `components.json` `registries` entry the
docs site's install instructions show. A namespace was chosen over embedding a full URL in
`registry.json` so the file doesn't hardcode a deploy origin.

The docs site is `demo-react` itself, not a new app: a small pushState router (no new dependency)
adds `/docs` (registry setup snippet, install-everything command, and the item list) and
`/docs/:item` (description, copy-paste `shadcn add @slash-editor/<item>` command, and a live
instance scoped to that one feature).
`/` keeps today's full playground. This matches the non-goal against adding docs tooling that
duplicates the Vite/Tailwind/shadcn stack already in place.

Release stays `bumpp`-driven: one invocation bumps `package.json`,
`packages/core/package.json`, and `packages/react/package.json` to the same version in one prompt
(true lockstep, not two separate releases). A tag push (`v*`) runs GitHub Actions: build, `vp
check`, `shadcn build` (registry schema gate), then publish. Publishing uses real `npm publish`
(not `bun publish`, which has no OIDC support — oven-sh/bun#22423, #24855) authenticated via npm's
OIDC Trusted Publishing, so the workflow stores no long-lived npm token at all; `bun pm pack`
still does the packing (it resolves `packages/react`'s `workspace:*` dependency on core to a real
version — plain npm has no notion of that protocol), and `npm publish` uploads the resulting
tarball. Trusted Publishing cannot bootstrap a brand-new package: npm requires the package to
already exist before a Trusted Publisher can be configured on npmjs.com, so each package's very
first publish is a one-time manual `npm publish` a maintainer runs locally with their own npm
account, after which the GitHub Actions + workflow-filename pair is registered as that package's
Trusted Publisher and every subsequent tag push publishes with zero stored secrets. No hosted
release service — the workflow runs on GitHub's own runners against the public npm registry,
consistent with the MIT/self-hostable stance.

### Performance constraints

- Per-extension entry points in core; no barrel-only exports. Target `createBlockKit()` < 45 kB gz on top of Tiptap.
- Heavy payloads lazy-loaded in the registry layer only: lowlight grammars, emoji data, table utils.
- Drag hover targeting uses a single delegated listener with cached block rects, invalidated on transaction, not per `mousemove`.

## 3. Delivery

### Testing strategy

| Layer    | Tool                       | What is actually asserted                                                                                                 |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| core     | `vp test` (Node, no DOM)   | commands produce expected doc JSON; input rules; slash filter/rank/`when`; markdown round-trip; unknown-node preservation |
| react    | RTL                        | menu keyboard nav + a11y roles, IME guard, StrictMode remount, SSR render                                                 |
| registry | Playwright in `demo-react` | slash insert, drag reorder, nest/unnest, paste from Notion HTML, mobile viewport toolbar                                  |
| release  | install test               | `shadcn add` into a scratch Vite + Next app, typecheck, build                                                             |

No snapshot tests of markup — registry markup is user-owned and expected to change.

### Milestones

- **M0 — Foundation.** Convert repo to bun workspaces, delete starter placeholders (`src/`, `tests/index.test.ts`), rename package metadata, wire `vp check`/`vp test`/build for 3 packages, Tailwind + shadcn in `demo-react`.
  _Done when:_ `@slash-editor/core` and `/react` build and the demo renders a bare Tiptap doc.
- **M1 — Block UX.** ✅ Done. BlockId, block kit nodes, markdown input rules, slash menu (core + hook + shadcn Command UI), drag handle, reorder, list nesting, bubble toolbar, browser regression coverage.
  _Done when:_ a user can build a Notion-style page with keyboard only; Playwright covers insert/reorder/nest.
  _Landed:_ slash menu (`slashCommand`, `useSlashMenu`, shadcn `Command`+`Popover`); `BlockId` (auto type derivation, insert/parse-only assignment, dedupe-on-paste, remote-skip); `BlockDrag` (pointer-driven hover/reorder/nest, `moveBlock`/`moveBlockUp`/`moveBlockDown`, `Alt-Shift-ArrowUp/Down`, gutter handle + drop indicator in the demo); block nodes (`Callout` custom node, `Details`/`DetailsSummary`/`DetailsContent` from `@tiptap/extension-details`, `TaskList`/`TaskItem` from `@tiptap/extension-list`, all wired into `createBlockKit` and `defaultSlashItems`); bubble toolbar (`BubbleToolbar` extension gating on a non-empty text selection via `onTransaction`/`onFocus`/`onBlur`, `useBubbleToolbar`, shadcn `Popover` rendering bold/italic/strike/code toggles); Playwright regression suite in `demo-react/tests/e2e` (`bun run test:e2e`) covering slash insert, gutter-handle reorder, drag-to-nest, and paste normalization from representative Notion and Google Docs clipboard HTML.
- **M2 — Media & structure.** ✅ Done. Image/file/video/embed with pluggable `UploadAdapter`, tables, columns.
  _Done when:_ upload adapter contract documented; failure/retry path e2e-tested.
  _Landed:_ `UploadAdapter` contract plus `runUpload`/`retryUpload` orchestration and `PendingUploadRegistry`
  (`packages/core/src/upload.ts` — the picked `File` lives in per-node storage keyed by `BlockId`, never in
  doc attrs, so it stays Yjs-safe); `Image`/`File`/`Video` nodes sharing that upload/retry shape, each with
  an empty placeholder state and `status`/`error` in doc attrs so completion re-renders through the normal
  transaction pipeline; `Embed` (bookmark/iframe, no adapter — nothing async); `Columns`/`Column`
  (`content: "column{2,}"`, the first non-list nesting surface); `TableKit` from `@tiptap/extension-table`
  with resizable columns on by default; every M2 node is `false`-opt-out-able from `createBlockKit`, the
  same seam M1 used for `slash`/`blockId`/`drag`, so `demo-react` supplies `NodeView`-augmented variants via
  `extend` (`Image.extend({ addNodeView: () => ReactNodeViewRenderer(...) })`) without a duplicate schema
  registration; Playwright coverage of the real upload → error → retry → ready transition against a mock
  adapter, plus table/columns/embed insertion.
- **M3 — Mentions & AI.** ✅ Done. `@`-mentions with async provider, inline link editing, AI slash actions over a `StreamAdapter` (bring-your-own endpoint, SSE).
  _Done when:_ demo works against a local mock endpoint; no vendor SDK in deps.
  _Landed:_ `Mention` (async `Suggestion` provider with `loading`/`debounce`/abort, opt-in via
  `mention: { items }`); `LinkEditor` (popover visibility + draft href only — applying/removing calls
  the `link` mark's own commands directly; auto-opens on cursor-in-link, plus a bubble-toolbar "Link"
  item for drafting over a selection); `AiBlock` transient node + `StreamAdapter` contract +
  `PendingAiRegistry` + four default slash actions via `createAiSlashItems`, opt-in via `ai: { adapter }`
  with a `node: false` opt-out for a host-supplied `NodeView` (`demo-react`'s `AiBlockNodeView`: Keep/
  Discard/Try again). Playwright coverage of async search, click-to-edit/remove, and the real
  stream → error → retry → keep/discard transitions against mock providers.
- **M4 — Collaboration.** ✅ Done. Yjs + `y-prosemirror` (via Tiptap's official `Collaboration`/
  `CollaborationCaret`), a Bun-native Hocuspocus self-host recipe, presence cursors, comment marks +
  thread store adapter.
  _Done when:_ two browsers converge on concurrent edits across all custom nodes; offline reconnect merges cleanly.
  _Landed:_ see `project-pdr/milestones.md` for the full write-up.
- **M5 — Distribution.** ✅ Done. shadcn registry items (granular + `slash-editor-kit` umbrella
  block) for every editor UI piece, a docs site built into `demo-react` (`/docs` overview +
  `/docs/:item` live pages), and a lockstep `bumpp` release wired to a tag-triggered GitHub
  Actions publish workflow.
  _Done when:_ `shadcn add` installs the menu into a scratch Vite and Next app and both type-check
  and build.
  _Landed:_ see `project-pdr/milestones.md` for the full write-up, including the cross-registry
  namespace fix and the anchor-aware `popover`/`dropdown-menu` overrides the scratch-app
  verification surfaced.

### Rollout

- `0.x` semver, `bumpp` for releases; core/react versioned in lockstep.
- Registry served from the docs site as `/r/[name].json`, validated in CI against the shadcn registry schema.
- Docs site doubles as the playground; every component page shows live editor + copy-paste command.

### Open risks

| Risk                                             | Mitigation                                                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tiptap relicenses future extensions              | Core depends only on `@tiptap/core` + `@tiptap/pm`; custom nodes are ours. Escape hatch is plain ProseMirror.                            |
| Tiptap ships a Tailwind UI kit                   | Differentiation stays the block interaction model and registry ownership, not button styling.                                            |
| Universal nesting demanded later                 | Container-node approach can add nodes incrementally; wrapper-schema migration documented as a breaking 1.0 option.                       |
| Yjs retrofit at M4                               | Determinism rules for attrs/IDs enforced from M1 and covered by core tests.                                                              |
| Registry drifts from source as components change | `shadcn build` runs against the real source files every release, not a hand-maintained copy — drift fails the build, not silently ships. |
