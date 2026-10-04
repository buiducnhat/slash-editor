---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Localization (`@slash-editor/core`, `@slash-editor/react`):

- **`messages` option on `createBlockKit`.** Overrides slash item, block type, and AI action text by id (`title`, `description`, `aliases`, `keywords`), slash menu group headings, the slash hint, empty-block placeholders, block menu titles, and bubble toolbar labels. Partial translations keep English for everything left out; the existing `slash.hint` and `placeholder.text` options still win.
- **`localizeItems`, `localizeBlockMenuItems`, `localizeBubbleToolbarItems`** helpers, the `messages` extension, and `editor.storage.messages`.
- **`useBlockMenu`** returns translated titles. The registry `block-handle` and `bubble-toolbar` now read block types from `useBlockTypes` so translated titles reach their menus.
