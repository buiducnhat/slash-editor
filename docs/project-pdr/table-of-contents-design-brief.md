# Table of Contents & Read-Only Documents — Design Brief

Status: accepted (brainstorm output) · Date: 2026-09-29

Decisions confirmed in review: both `link`/`taskItem` seams included; the `tableOfContents`
extension is default-on with a `false` opt-out.

## 1. Foundation

### Problem

The registry ships ten UI surfaces, but nothing navigates a long document: there is no
heading outline, and no supported answer for "render this document without letting anyone
edit it". Both are table stakes for a Notion-grade editor, and both are currently reachable
only by hand-rolling against Tiptap APIs.

Two facts make this cheaper than it looks:

- Every top-level block already carries `attrs.id`, rendered as `data-block-id` by
  `blockId` (`packages/core/src/block-id.ts`). An outline needs **no schema change**.
- Core already gates UI on `editor.isEditable`: `canOpenLinkEditor` (link editor),
  `BubbleToolbar.computeState`, `placeholder`, `toggle`'s chevron, and Tiptap's own
  `Suggestion` plugin (`packages/core/node_modules/@tiptap/suggestion/dist/index.js:192`).
  A read-only editor degrades correctly today — with three exceptions listed under
  Technical Details.

### Goals

- `@slash-editor/table-of-contents` registry item: heading outline of the live document,
  shadcn tokens, works in both edit and read-only mode.
- Core computes the outline and owns the store; React coordinates the active heading;
  registry renders. Same three-layer split as `slash-command`/`bubble-toolbar`.
- Outline logic testable in Node, with no DOM — the `code-standard/testing-and-verification.md`
  bar for core.
- Active heading is cursor-driven while editable, scroll-driven when read-only.
- Top-level headings only (direct children of the document).
- Read-only is **documented, not a new component**: `useSlashEditor({ editable: false })`
  plus the two option seams that make a viewer actually usable.

### Non-goals

- Headings nested inside containers (toggle/callout/columns/table).
- Outline numbering, minimap/scrollbar markers, drag-to-reorder from the outline.
- A `document-viewer` registry item, or any viewer-specific component.
- An outline for the docs site sidebar — Fumadocs already derives that from the file tree.

### Architecture

```mermaid
flowchart LR
  subgraph core [@slash-editor/core]
    EXT["tableOfContents() extension<br/>doc scan on transaction"]
    STORE["storage: { state, subscribe, setState }"]
    SCROLL["scrollToHeading(pos)"]
    EXT --> STORE
  end
  subgraph react [@slash-editor/react]
    HOOK["useTableOfContents(editor)<br/>useExtensionState + active id"]
  end
  subgraph registry [site/registry]
    UI["table-of-contents.tsx<br/>nav list, active row, click"]
  end
  STORE --> HOOK
  HOOK --> UI
  UI -->|select| SCROLL
```

The rule that keeps the split honest (unchanged): **core computes, react coordinates,
registry renders.** Core emits no class names.

## 2. Technical Details

### Core — `packages/core/src/table-of-contents.ts` (new)

```ts
export interface TableOfContentsItem {
  id: string | null; // the heading's BlockId attr; null when `blockId` is opted out
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string; // heading text, whitespace-collapsed
  pos: number; // doc position — the scroll/selection target, valid regardless of blockId
}

export interface TableOfContentsState {
  items: TableOfContentsItem[];
}

export interface TableOfContentsStorage {
  state: TableOfContentsState;
  subscribe(listener: () => void): () => void;
  setState(next: TableOfContentsState): void;
}

export interface TableOfContentsOptions {
  /** Highest heading level kept. Levels above it are skipped. Default 6. */
  maxLevel?: HeadingLevel;
}

/** Pure: no Editor, no DOM. Exported for tests and for hosts rendering their own outline. */
export function computeTableOfContents(
  doc: ProseMirrorNode,
  options?: TableOfContentsOptions,
): TableOfContentsItem[];

export const TableOfContents: Extension<TableOfContentsOptions, TableOfContentsStorage>;
export function tableOfContents(options?: TableOfContentsOptions): Extension;

/** Last item at or before `pos`. Pure. */
export function findActiveItem(items, from: number): TableOfContentsItem | null;
```

Implementation notes:

- **Top-level scan only**: `doc.forEach((node, offset) => …)` — never `descendants`, so
  headings inside containers are structurally excluded. For top-level nodes
  `pos === offset`.
- Item text is `node.textBetween(0, node.content.size, " ")`, so an inline mention or link
  inside a heading contributes its text.
- **Cost control**: `onTransaction` returns early unless the transaction changed the doc
  _and_ `listeners.size > 0`. No subscriber ⇒ no scan, so an app that never renders an
  outline pays nothing. With subscribers, the scan is `O(top-level children)` per changed
  transaction — caret-only transactions are skipped, which also stops the outline state
  from churning on every arrow key.
- `setState` compares items by `(id, level, text, pos)` and skips notifying when nothing
  changed — the same "never observable ⇒ never notify" rule `bubble-toolbar.ts` uses.
- Default is **on** with a `false` opt-out, matching every other kit option. Not a slash
  item: an outline is not an insertable block.
- A state field / decoration-based implementation is rejected: decorations force a view
  redraw for what is pure UI state, and a plugin state field duplicates the storage
  store the React layer already subscribes through.

### Core — two seams required by the read-only path

Audited against `editor.isEditable === false`. Already correct: slash menu, mention
(Tiptap's `Suggestion` checks `isEditable`), bubble toolbar, link editor, placeholder,
toggle chevron, Mermaid click-to-edit, block gutter (host simply doesn't render
`BlockHandle`). Three gaps, two of which need a small API addition:

| Gap                                                                    | Evidence                                                                                                                                                               | Fix                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Links are inert in a viewer                                            | `block-kit.ts` hardcodes StarterKit's `link: { openOnClick: false, enableClickSelection: true }`, and `extend` cannot re-register a duplicate name (Tiptap only warns) | Add `link?: { openOnClick?: boolean; enableClickSelection?: boolean } \| false` to `BlockKitOptions`, defaulting to today's values                                                                                                                                                                         |
| Task checkboxes are inert in a viewer                                  | `@tiptap/extension-list/dist/index.js:1279` — `!editor.isEditable && !onReadOnlyChecked` returns early                                                                 | Add `taskItem?: Partial<TaskItemOptions>` to `BlockKitOptions`, spread over `{ nested: true }`                                                                                                                                                                                                             |
| An `aiBlock` node in a read-only doc renders live Keep/Discard buttons | `site/registry/components/nodes/ai-block-node-view.tsx` does not check `isEditable`                                                                                    | Guide caveat: a viewer keeps `ai: { adapter, node: false }` registered. Verified while landing: with `ai` omitted entirely there is no `unknownBlock` fallback in shipped code (the M1 brief's promise), so such content logs `[tiptap warn]: Invalid content.` and degrades — the guide says exactly that |

Both seams are generic options, not viewer flags, so they stand on their own.

### React — `packages/react/src/use-table-of-contents.ts` (new)

```ts
export interface TableOfContents extends TableOfContentsState {
  /** The row to highlight; `null` above the first heading. */
  active: TableOfContentsItem | null;
  select(item: TableOfContentsItem): void;
}

export interface UseTableOfContentsOptions {
  /** Scrolling ancestor. Defaults to the window. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Pixels below the container top a heading must reach to become active. */
  scrollOffset?: number;
}

export function useTableOfContents(
  editor: Editor | null,
  options?: UseTableOfContentsOptions,
): TableOfContents;
```

- `items` via the existing `useExtensionState(editor, getStorage, EMPTY)` helper — the same
  shape as `useBubbleToolbar`.
- `active` has two sources, with explicit precedence:
  1. **Editable + focused view** → `findActiveItem(items, editor.state.selection.from)`.
     Recomputed on transaction; pure and unit-tested.
  2. **Read-only, or the editable view is unfocused** → scroll position. On scroll
     (rAF-throttled) collect the headings' `getBoundingClientRect()` via
     `editor.view.nodeDOM(pos)` and pick the last one whose `top <= containerTop + offset`.
     The choice is a pure function `pickActiveByScroll(rects, containerTop, offset)`;
     only the listener/observer wiring is DOM-bound and browser-verified.
- `select(item)` sets `active` optimistically, then **scrolls before moving the caret**:
  `scrollToHeading(pos, { behavior: "auto" })` followed by
  `chain().focus(undefined, { scrollIntoView: false }).setTextSelection(item.pos + 1).run()`.
  The order and the instant scroll are load-bearing: Tiptap's `focus` defers its own
  scroll-into-view to the next frame, and that nearest-edge scroll cancels a running
  animation, which parked the heading at the bottom edge of a scrolling pane. Scrolling
  first means every later scroll is a no-op — heading and caret are both already visible.
- Everything is safe with a `null` editor (empty items, `active: null`, no-op `select`),
  matching the documented guarantee for the other hooks in `docs/codebase/package-apis.md`.

### Registry — `site/registry/components/table-of-contents.tsx` (new)

- Props mirror the sibling surfaces: `{ editor, scrollContainer?, title?, className? }`.
- `<nav aria-label="Table of contents">` with one `<button>` per item (no `<a>` — there is
  no URL), `aria-current="location"` on the active row, `data-testid="toc-item"` and
  `data-toc-id` for e2e selectors.
- Indentation from `level` through a **static** class record (16px per depth below the shallowest
  heading: `pl-2`/`pl-6`/`pl-10`/…) — Tailwind cannot see a computed class name. The record owns
  the row's left padding outright: a base `px-*` would cancel most of the step (a `pl-3` over a
  `px-2` reads as a 4px difference).
- Semantic tokens only (`text-muted-foreground` → `text-foreground` when active), `truncate`
  on labels per the one-line-row rule in `code-standard/ui-conventions.md`.
- Returns `null` when the document has no headings above `maxLevel`; the consumer owns any
  empty state.
- `registry.json` item: `type: "registry:component"`, `dependencies:
["@slash-editor/core", "@slash-editor/react"]`, no `registryDependencies` (no shadcn
  primitive, no icons), and added to `slash-editor-kit`'s `registryDependencies` list.

### Read-only documentation — `content/docs/guides/read-only.mdx` (new)

Covers: `useSlashEditor({ editable: false })` for a permanent viewer vs.
`editor.setEditable(false)` for a runtime toggle; what stays interactive (link clicks with
`link: { openOnClick: true }`, task checkboxes with `taskItem.onReadOnlyChecked`, embeds,
Mermaid preview); what goes inert and why (slash/mention/bubble toolbar/link editor/gutter/
placeholder/toggle chevron); and the `aiBlock` caveat above. Ships a live demo
(`ReadOnlyDemo`) so the claims are visible on the page rather than asserted in prose.

### Edge cases and risks

| Case                                                                                   | Handling                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headings inside a toggle/callout/columns                                               | Excluded by the top-level `doc.forEach` scan (chosen scope, not an accident)                                                                                                                                                                                                                              |
| `blockId` opted out                                                                    | `id: null`; rows key off `pos` and `select` uses `pos`, so the outline still works                                                                                                                                                                                                                        |
| Insertions above a heading                                                             | `pos` shifts; items are recomputed on the same transaction, so rows re-key — `id` is used for React keys whenever present to avoid remount churn                                                                                                                                                          |
| Editable editor loses focus, user scrolls                                              | Falls through to scroll tracking; on refocus the cursor wins again                                                                                                                                                                                                                                        |
| Click then scroll in the same frame                                                    | `select` pins `activeId`; the next scroll/cursor event recomputes it                                                                                                                                                                                                                                      |
| Overlay/scroll container mismatch (editor inside a modal or its own `overflow-y-auto`) | `scrollContainer` prop for tracking; `scrollToHeading` pins the heading inside the nearest scrollable ancestor by hand                                                                                                                                                                                    |
| Heading does not land at the top of a scrolling pane                                   | `scrollIntoView({ block: "start" })` stops as soon as the element is visible in the _outer_ viewport (measured: 300px of a needed 381px). `scrollToHeading` therefore aligns inside the container itself (`scrollTop + rect delta`) and leaves the outer reveal to `scrollIntoView({ block: "nearest" })` |
| Per-keystroke scan cost                                                                | Skipped entirely with no subscribers; `O(top-level children)` otherwise                                                                                                                                                                                                                                   |

## 3. Delivery

### Files

| Path                                                                                                                      | Change                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `packages/core/src/table-of-contents.ts`                                                                                  | New: item/state/storage/options, `computeTableOfContents`, `findActiveItem`, extension |
| `packages/core/src/block-kit.ts`                                                                                          | `tableOfContents`, `link`, `taskItem` options                                          |
| `packages/core/src/index.ts`, `packages/react/src/index.ts`                                                               | Exports                                                                                |
| `packages/react/src/use-table-of-contents.ts`                                                                             | New hook                                                                               |
| `site/registry/components/table-of-contents.tsx`                                                                          | New component                                                                          |
| `site/registry.json`                                                                                                      | New item + kit `registryDependencies`                                                  |
| `site/components/demo/registry-demos.tsx`, `…preview.tsx`                                                                 | `TableOfContentsDemo` (two-column, scrollable editor pane), `ReadOnlyDemo`             |
| `site/content/docs/components/table-of-contents.mdx`, `components/meta.json`                                              | Component page with `<ComponentPreview>`                                               |
| `site/content/docs/guides/read-only.mdx`, `guides/meta.json`                                                              | Guide page                                                                             |
| `docs/codebase/directory-structure.md`, `docs/codebase/package-apis.md`, `docs/code-standard/testing-and-verification.md` | Inventory, API, and suite tables                                                       |
| `.changeset/*.md`                                                                                                         | Minor: `@slash-editor/core`, `@slash-editor/react`                                     |

### Verification

**Core unit (`vp test`, Node, no DOM)** — new `packages/core/tests/table-of-contents.test.ts`:

- `computeTableOfContents` returns top-level headings in document order with correct
  `level`/`text`/`pos`; excludes headings nested in toggle, callout, columns, and table
  cells; honours `maxLevel`; returns `[]` for a heading-free doc; tolerates a missing
  `attrs.id`.
- `findActiveItem` boundaries: before the first heading, exactly at a heading, between
  headings, past the last one.
- `pickActiveByScroll` boundaries: all rects below the container top, exactly at the
  offset, empty list.
- Storage: no notification when the outline is unchanged; no scan with zero subscribers.
- Kit wiring: default-on, `false` opt-out, `link`/`taskItem` defaults unchanged when
  unset (extends `block-kit.test.ts`).

**Browser (`vp run -F site test:e2e`)** — new `site/tests/e2e/table-of-contents.spec.ts`:

- Rows match the headings in the demo document, in order, with correct indentation.
- The active row follows the caret; typing a new heading appends a row live; editing a
  heading's text updates its row.
- Clicking a row moves the caret into that heading and scrolls it into view.
- On the read-only demo: no cursor tracking, scroll drives the active row, and the
  documented interactivity (link click, checkbox toggle) actually works.
- A document with no headings renders no `nav`.

**Manual**: dark mode, levels 1–6 with `headingLevels`, long-heading truncation, TOC inside
a scrollable pane vs. window scroll, mobile viewport.

### Rollout

`0.x` minor for both packages; registry item ships with the next release. No migration:
the extension is additive and default-on, and the `link`/`taskItem` options default to
today's hardcoded values.
