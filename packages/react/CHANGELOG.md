# @slash-editor/react

## 0.6.0

### Minor Changes

- 41e49ac: Emoji picker (`@slash-editor/core`, `@slash-editor/react`):

  - **`emoji` extension.** Wraps `@tiptap/extension-emoji` (MIT) with a `:`-triggered picker that exposes the same subscribe/state shape as `mention`. `:shortcode:` input and paste rules, unicode-to-node conversion, and markdown (`:shortcode:`, unknown shortcodes stay text) are included. Opt-in: `createBlockKit({ emoji: {} })`.
  - **`/emoji` slash item.** Shown only while the node is registered; types the `:` that opens the picker.
  - **`useEmoji` hook and `emoji-menu` registry item.** Command-in-Popover surface that follows the `mention-menu` pattern. Included in `slash-editor-kit`.

- 66f2eea: Localization (`@slash-editor/core`, `@slash-editor/react`):

  - **`messages` option on `createBlockKit`.** Overrides slash item, block type, and AI action text by id (`title`, `description`, `aliases`, `keywords`), slash menu group headings, the slash hint, empty-block placeholders, block menu titles, and bubble toolbar labels. Partial translations keep English for everything left out; the existing `slash.hint` and `placeholder.text` options still win.
  - **`localizeItems`, `localizeBlockMenuItems`, `localizeBubbleToolbarItems`** helpers, the `messages` extension, and `editor.storage.messages`.
  - **`useBlockMenu`** returns translated titles. The registry `block-handle` and `bubble-toolbar` now read block types from `useBlockTypes` so translated titles reach their menus.
  - **Pages and uploads.** `untitledPage` and `uploadFailed` messages; `pageTitle`, `pages` and `withPageMentions` take an optional `untitled` argument. `/page` and `/link to page` are translated through `items`/`groups`.

- bde70c4: Pages (`@slash-editor/core`, `@slash-editor/react`):

  - **`subPage` block and `pageLink` inline node.** Each carries only a `pageId`; titles, icons and the tree live in a host-owned `PageStore`. Opt-in: `createBlockKit({ pages: { store, currentPageId, onNavigate } })`. Adds `/page` and `/link to page`, and merges page results into the `@` menu (`MentionItem.kind: "page"`).
  - **Detach/attach reporting.** `onSubPagesDetached`/`onSubPagesAttached` report local deletes, undo and paste; moves and remote edits stay silent. Duplicating or pasting a sub-page owned elsewhere becomes a `pageLink`.
  - **Helpers.** `collectPageRefs`, `getPagesOptions`, `pageTitle`, a `nodeViews` option for UI layers, and markdown export/import of both nodes.
  - **React hooks.** `usePage`, `usePageTree`, `useBreadcrumb` and `useBacklinks` read a `PageStore` with no editor.

### Patch Changes

- Updated dependencies [65f7886]
- Updated dependencies [41e49ac]
- Updated dependencies [66f2eea]
- Updated dependencies [bde70c4]
  - @slash-editor/core@0.6.0

## 0.5.1

### Patch Changes

- 552670e: Importing `@slash-editor/react` no longer throws `DOMRect is not defined` during SSR/prerender: the empty fallback anchor rect is created on first use instead of at module scope. Registry: `popover`/`dropdown-menu` now declare `@base-ui/react` and `cn`, and components import `cn` directly instead of `@/lib/utils`, so `shadcn add @slash-editor/slash-editor-kit` works in an app that never ran `shadcn init`.
- Updated dependencies [552670e]
  - @slash-editor/core@0.5.1

## 0.5.0

### Minor Changes

- 48c593c: Document table of contents and read-only documents (`@slash-editor/core` 0.5.0, `@slash-editor/react` 0.5.0):

  - **`tableOfContents` extension.** The document outline — top-level headings with `id`, `level`, `text`, and a `pos` that addresses each node — computed on change and exposed as the same subscribe/store shape the other surfaces use. Pure helpers (`computeTableOfContents`, `findActiveItem`, `pickActiveByScroll`) stay DOM-free and unit-tested; `scrollToHeading(pos)` jumps to a heading. With no subscriber the extension never scans the document. `createBlockKit({ tableOfContents })` configures or opts it out.
  - **`useTableOfContents` hook and `table-of-contents` registry item.** Outline nav with an active row tracked from the caret while editing and from the scroll position otherwise; clicking a row jumps to its heading. Included in `slash-editor-kit`.
  - **Read-only documents.** Two new `createBlockKit` seams make a viewer (`useSlashEditor({ editable: false })`) interactive instead of dead weight: `link: { openOnClick: true }` for link navigation and `taskItem: { onReadOnlyChecked }` for checkboxes. Both keep today's behavior by default. The new `guides/read-only` page documents what else stays live and what goes inert.

### Patch Changes

- Updated dependencies [48c593c]
  - @slash-editor/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies
  - @slash-editor/core@0.4.0

## 0.3.3

### Patch Changes

- Updated dependencies
  - @slash-editor/core@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies
  - @slash-editor/core@0.3.2

## 0.3.1

### Patch Changes

- Fix bubble toolbar flickering when opening Turn into or Ask AI dropdowns
- Updated dependencies
  - @slash-editor/core@0.3.1

## 0.3.0

### Minor Changes

- Unify slash, bubble-toolbar, and block-menu actions around shared block and AI registries. AI adapters now live on editor storage and support cursor, selection, and block contexts with Replace/Insert-below acceptance modes.

  Move comment stores onto the comment extension, add store subscriptions and an anchored comment composer, add shared virtual-anchor helpers and the `useBlockTypes`, `useAiActions`, and `useBlockMenu` hooks. This removes `AiSlashAction`, `defaultAiSlashActions`, and the store argument from `useComments`.

### Patch Changes

- Updated dependencies
  - @slash-editor/core@0.3.0

## 0.2.1

### Patch Changes

- Ships with `@slash-editor/core` 0.2.1 (the two packages are released in lockstep), which fixes
  the block gutter handle sticking to the viewport on scroll. No API change here.
- Updated dependencies
  - @slash-editor/core@0.2.1

## 0.2.0

### Patch Changes

- Ships with `@slash-editor/core` 0.2.0 (the two packages are released in lockstep), which adds
  markdown import/export through `@slash-editor/core/markdown`. No API change here — add
  `markdown()` to `useSlashEditor({ blockKit: { extend: [markdown()] } })`.
- Updated dependencies
  - @slash-editor/core@0.2.0

## 0.1.1

### Patch Changes

- Ships with `@slash-editor/core` 0.1.1 (the two packages are released in lockstep): the
  gutter's hover controls anchor to a block's first line, and clicking the whitespace
  between blocks no longer turns the next keystroke into a new block. No API change here —
  the fix lives in core, which `useBlockDrag` reads its anchors from.
- Updated dependencies
  - @slash-editor/core@0.1.1

## 0.1.0

### Minor Changes

- 7b349d3: Initial documented OSS release. M0–M7 shipped: slash menu, block ids, drag handle,
  media/upload, mentions/AI, real-time collaboration, npm packages, shadcn registry,
  docs site, and playground.

### Patch Changes

- Updated dependencies [7b349d3]
- Updated dependencies
  - @slash-editor/core@0.1.0
