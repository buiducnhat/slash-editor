# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Changesets populates this file. Do not edit manually. -->

## [0.3.1] — 2026-09-25

Bubble toolbar dropdown focus fix (`@slash-editor/core` 0.3.1, `@slash-editor/react` 0.3.1):

- **Prevent bubble toolbar flickering on dropdown open.** Clicking into "Turn into" (`BlockTypeDropdown`)
  or "Ask AI" (`AskAiDropdown`) no longer dismisses and re-opens the bubble toolbar. Core's
  `computeState` and `onBlur` now retain visibility when focus transitions to toolbar popover or
  dropdown menu controls (`[data-slot="dropdown-menu-content"]`, `[data-slot="popover-content"]`,
  `[role="menu"]`), and dropdown menus are rendered non-modal (`modal={false}`).

## [0.3.0] — 2026-09-25

Unified action registries, AI storage, and comment composer (`@slash-editor/core` 0.3.0,
`@slash-editor/react` 0.3.0):

- **Unified block types.** `defaultBlockTypes` in core acts as the single source of truth for
  slash command blocks, bubble toolbar block-type switcher, and the block handle "Turn into"
  menu.
- **Centralized AI extension.** `ai` extension now lives on editor storage, holding the configured
  `StreamAdapter` and `AiAction` items across slash, selection, and block contexts.
  `runAiAction` defaults to storage adapter and tracks mapped source ranges, supporting both
  `Replace` and `Insert below` actions.
- **Integrated comment store & composer.** `CommentThreadStore` registers via `comment({ store })`
  with required `subscribe(listener)` updates. An inline `CommentComposer` popover attaches to the
  bubble toolbar and syncs with the comment sidebar panel.
- **Headless React bindings & clean cutover.** Added `useBlockTypes`, `useAiActions`, `useBlockMenu`,
  unified `VirtualAnchor`, and updated `useComments`. Deleted empty directories in `@slash-editor/react`.

## [0.2.1] — 2026-09-24

One block-gutter fix in the shared core (`@slash-editor/core` 0.2.1, `@slash-editor/react`
0.2.1):

- **The gutter handle no longer sticks to the viewport on scroll.** `BlockDrag` cached block
  rects in viewport coordinates and only invalidated them on a doc update, so a scroll left
  both the hover match and the rect the gutter is positioned from stale: the handle held its
  place on screen while its block moved away. Any scroll — the page, an ancestor, or a drag's
  own auto-scroll — now invalidates the rects and re-resolves hover and drop from the last
  pointer position, coalesced to one frame. A still pointer therefore re-targets whichever
  block scrolls under it, and a drag's drop indicator tracks the pointer through auto-scroll.

## [0.2.0] — 2026-09-23

Markdown import/export (`@slash-editor/core` 0.2.0, `@slash-editor/react` 0.2.0):

- **New `@slash-editor/core/markdown` entry.** `markdown()` adds `editor.getMarkdown()` and
  `setContent(md, { contentType: "markdown" })`; `serializeMarkdown`/`parseMarkdown` do the
  same without an editor or a DOM. A separate entry, so `marked` (~20 KB gzipped) stays out of
  bundles that never import it.
- **GitHub-flavoured output that round-trips.** Callouts become `> [!TIP]`-style alerts, toggles
  `<details>`, and columns, media metadata, and mention ids ride in `<!-- slash:… -->` comments
  GitHub hides. AI drafts and unfinished uploads are left out; comment anchors keep their text.
- **Playground.** A Markdown panel mirrors the document live, and imports/downloads `.md` files.

## [0.1.1] — 2026-09-23

Two block-chrome fixes, both in the shared core (`@slash-editor/core` 0.1.1,
`@slash-editor/react` 0.1.1):

- **No gap cursor.** StarterKit's `gapcursor` is off, so clicking the strip a block's
  margin leaves between it and its neighbour focuses the nearest line instead of placing
  a cursor in the void that turned the next keystroke into a block of its own. Toggles
  hit this most, since `details` is `isolating` and ProseMirror offers a gap cursor on
  every isolated block's boundary.
- **The gutter handle rides the block's first line.** `BlockTarget.getClientRect` used to
  report the block's whole box, and the hover controls are centred on it — so a tall
  block (a multi-line column, a table, an expanded toggle) parked `+`/grip halfway down
  its height. It now measures the block's first text line, padding included, falling back
  to the block's own line box when there is no text to measure (a rule, a ready image).

## [0.1.0] — 2026-09-22

Initial documented release. M0–M7 shipped:
slash menu, block ids, drag handle, media/upload, mentions/AI, real-time collaboration,
npm packages (`@slash-editor/core`, `@slash-editor/react`), shadcn registry, docs site,
and playground.

Toggle blocks gained caret navigation, an exit from the body, and per-line gutter handles:

- `Enter` on a toggle title hands the caret to the body — into a fresh toggle's empty
  placeholder line, or a new block on top of an existing body — reopening a collapsed
  toggle first; `Enter` on an empty last body block leaves the toggle into a new paragraph
  after it.
- `ArrowDown` leaves the body from its last block (and a collapsed toggle from its title);
  `ArrowUp` on the first body block returns to the end of the title.
- A toggle body's blocks are drag units: each line gets its own hover handle, and
  move/duplicate/delete act on that line instead of the whole toggle.
- A toggle's own gutter handle anchors to its title line rather than the centre of its
  expanded body.

<!-- generated by changesets -->
