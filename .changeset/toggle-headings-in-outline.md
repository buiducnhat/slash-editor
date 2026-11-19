---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Table of contents can include headings nested in toggles (`@slash-editor/core`, `@slash-editor/react`):

- **`tableOfContents({ includeToggles: true })`.** Off by default. When on, a toggle's own title counts as an outline item (when its heading level is non-zero), and headings inside its body are scanned too, recursing into nested toggles. Callout, columns, and table cell stay excluded regardless of this option.
- Each `TableOfContentsItem` reached this way carries `togglePos`, the position of the nearest enclosing toggle that must be open for it to render. `scrollToHeading`/`useTableOfContents`'s `select` use it to open that toggle and every toggle above it — as steps on the command's transaction when toggles persist `open`, or through the disclosure button when they don't — before scrolling to it.
- `useTableOfContents`'s scroll-driven active row now skips headings hidden inside a closed toggle instead of misreading their zeroed layout rect as "above the viewport".
