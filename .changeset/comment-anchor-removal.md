---
"@slash-editor/core": patch
"@slash-editor/react": patch
---

`unsetComment(threadId)` now removes the thread's anchors across the whole document instead of only the selection (new pure `removeCommentThread` helper), so `useComments().removeAnchor` works from a sidebar; it no longer focuses the editor.
