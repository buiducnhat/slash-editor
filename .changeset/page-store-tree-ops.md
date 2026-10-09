---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Page tree operations (`@slash-editor/core`, `@slash-editor/react`):

- **Optional `PageStore.setTrashed(ids, trashed)` and `PageStore.move(id, { parentId, index })`.** Trash/restore pages and re-parent or reorder them. The library never calls them; they are the contract for your page-tree UI and for `onSubPagesDetached`/`onSubPagesAttached`. `listChildren` is now documented as returning siblings in order (trashed included), which `usePageTree` renders as-is. `move`'s `index` counts among `listChildren(parentId)` without the moved page, clamped; moving a page into itself or a descendant is a no-op.
- The registry `createDemoPageStore` implements both and persists sibling order.
