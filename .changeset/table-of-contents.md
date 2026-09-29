---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Document table of contents and read-only documents (`@slash-editor/core` 0.5.0, `@slash-editor/react` 0.5.0):

- **`tableOfContents` extension.** The document outline — top-level headings with `id`, `level`, `text`, and a `pos` that addresses each node — computed on change and exposed as the same subscribe/store shape the other surfaces use. Pure helpers (`computeTableOfContents`, `findActiveItem`, `pickActiveByScroll`) stay DOM-free and unit-tested; `scrollToHeading(pos)` jumps to a heading. With no subscriber the extension never scans the document. `createBlockKit({ tableOfContents })` configures or opts it out.
- **`useTableOfContents` hook and `table-of-contents` registry item.** Outline nav with an active row tracked from the caret while editing and from the scroll position otherwise; clicking a row jumps to its heading. Included in `slash-editor-kit`.
- **Read-only documents.** Two new `createBlockKit` seams make a viewer (`useSlashEditor({ editable: false })`) interactive instead of dead weight: `link: { openOnClick: true }` for link navigation and `taskItem: { onReadOnlyChecked }` for checkboxes. Both keep today's behavior by default. The new `guides/read-only` page documents what else stays live and what goes inert.
