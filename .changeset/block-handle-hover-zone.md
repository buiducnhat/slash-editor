---
"@slash-editor/core": patch
---

Keep the block handle inside the hover zone. `BlockDrag` now measures `gutterWidth` from the hovered block's left edge (or the editor box, whichever is further left) and defaults it to the new `BLOCK_GUTTER_WIDTH` (80px), which the registry `BlockHandle` lays itself out in — so the handle no longer vanishes on the way to it in an editor with little or no left padding. The geometry is exported as the pure `resolveHoverRect`.
