# @slash-editor/core

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
