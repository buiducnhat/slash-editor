# @slash-editor/core

## 0.3.0

### Minor Changes

- Unify slash, bubble-toolbar, and block-menu actions around shared block and AI registries. AI adapters now live on editor storage and support cursor, selection, and block contexts with Replace/Insert-below acceptance modes.

  Move comment stores onto the comment extension, add store subscriptions and an anchored comment composer, add shared virtual-anchor helpers and the `useBlockTypes`, `useAiActions`, and `useBlockMenu` hooks. This removes `AiSlashAction`, `defaultAiSlashActions`, and the store argument from `useComments`.

## 0.2.1

### Patch Changes

- Block drag: re-resolve the hovered block and drop target when the page or an ancestor scrolls. The gutter handle no longer stays pinned to the viewport while scrolling, and a drag's drop indicator follows the pointer through scrolls, including its own auto-scroll.

## 0.2.0

### Minor Changes

- Markdown import/export through a new `@slash-editor/core/markdown` entry.

  - `markdown()` — add it via `createBlockKit({ extend: [markdown()] })` for `editor.getMarkdown()`
    and `setContent(md, { contentType: "markdown" })`. `serializeMarkdown`/`parseMarkdown` do the
    same without an editor or a DOM.
  - Output is GitHub-flavoured: callouts become `> [!TIP]`-style alerts, toggles `<details>`, and
    columns, media metadata, and mention ids ride in `<!-- slash:… -->` comments GitHub hides.
    Every slash-editor node survives the round trip.
  - AI drafts and unfinished uploads are left out (new `excludeFromMarkdown` node field); comment
    anchors keep their text.
  - `marked` stays out of bundles that never import the entry, and each editor gets its own
    `Marked` instance instead of registering into the global one.

## 0.1.1

### Patch Changes

- Blocks no longer take a gap cursor, and the gutter handle rides a block's first line.

  - StarterKit's `gapcursor` is off: clicking the empty strip a block's margin leaves
    between it and its neighbour used to place a gap cursor, and the next keystroke became
    a block of its own instead of joining the nearest line.
  - `BlockTarget.getClientRect` reports the block's first line rather than its box, so a
    tall block — a multi-line column, a table, an expanded toggle — keeps its hover
    controls at its top instead of centring them on its height. Top padding (callout, code
    block, table cell) is measured, and a block with no text falls back to its own line box.

## 0.1.0

### Minor Changes

- 7b349d3: Initial documented OSS release. M0–M7 shipped: slash menu, block ids, drag handle,
  media/upload, mentions/AI, real-time collaboration, npm packages, shadcn registry,
  docs site, and playground.
- Toggle blocks: caret navigation, an exit from the body, and per-line gutter handles.

  - `Enter` on a toggle title hands the caret to the body — into a fresh toggle's empty
    placeholder line, or a new block on top of an existing body — reopening a collapsed
    toggle first.
  - `Enter` on an empty last body block leaves the toggle into a new paragraph after it.
  - `ArrowDown` leaves the body from its last block (and a collapsed toggle from its
    title); `ArrowUp` on the first body block returns to the end of the title.
  - A toggle body's blocks are drag units: each line gets its own hover handle, and
    move/duplicate/delete act on that line instead of the whole toggle.
  - A toggle's own gutter handle anchors to its title line rather than the centre of its
    expanded body.
