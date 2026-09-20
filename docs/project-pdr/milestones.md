# Milestones

Status legend: **Done** · **In progress** · **Not started**

| Milestone                         | Status         |
| --------------------------------- | -------------- |
| M0 — Foundation                   | ✅ Done        |
| M1 — Block UX                     | ✅ Done        |
| M2 — Media & structure            | ⬜ Not started |
| M3 — Mentions & AI                | ⬜ Not started |
| M4 — Collaboration                | ⬜ Not started |
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

## M2 — Media & structure ⬜

_Done when: the upload adapter contract is documented and the failure/retry path is verified end to end._

- [ ] `UploadAdapter` contract (`status: uploading | ready | error`, retry command)
- [ ] Image, file, video nodes
- [ ] Embed node (bookmark / iframe)
- [ ] Tables
- [ ] Columns (container node, first non-list nesting surface)

## M3 — Mentions & AI ⬜

_Done when: the demo works against a local mock endpoint with no vendor SDK in the dependency graph._

- [ ] `@`-mentions with async provider
- [ ] Inline link editing UI
- [ ] AI slash actions over a `StreamAdapter` (bring-your-own SSE endpoint)

## M4 — Collaboration ⬜

_Done when: two browsers converge on concurrent edits across every custom node and reconnect cleanly after offline edits._

- [ ] Yjs + `y-prosemirror` wiring, `history: false` path exercised
- [ ] Hocuspocus self-host recipe
- [ ] Presence cursors
- [ ] Comment mark + external thread store adapter

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
