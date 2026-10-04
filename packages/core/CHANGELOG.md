# @slash-editor/core

## 0.7.0

### Minor Changes

- 7181263: Emoji and highlighted code blocks move to their own entries (`@slash-editor/core`, `@slash-editor/react`):

  - **Breaking: `@slash-editor/core/emoji` and `@slash-editor/core/code-block` subpaths.** `Emoji`, `emoji`, `searchEmojis` and the `EmojiItem`/`EmojiMenuState`/`EmojiMenuStorage`/`EmojiOptions` types now import from `@slash-editor/core/emoji`; `CodeBlock`, `codeBlock` and the `CodeBlockOptions`/`Lowlight` types from `@slash-editor/core/code-block`. The root entry no longer exports them.
  - **Breaking: `createBlockKit` takes the built node.** `emoji` and `codeBlock` accept the extension instead of its options (`codeBlock` still accepts `false` for no code block), so the kit never imports the emoji dataset or lowlight. `createBlockKit()` drops from ~323 KB to ~198 KB gzipped (minified browser bundle, dependencies included) when neither is used.
  - **`"sideEffects": false`** in both packages, so bundlers can drop unused modules.

  Migration:

  ```ts
  // Before
  import { CodeBlock, createBlockKit } from "@slash-editor/core";

  createBlockKit({ emoji: { limit: 24 }, codeBlock: { lowlight } });
  createBlockKit({ codeBlock: false, extend: [CodeBlock.extend({ addNodeView })] });

  // After
  import { createBlockKit } from "@slash-editor/core";
  import { CodeBlock, codeBlock } from "@slash-editor/core/code-block";
  import { emoji } from "@slash-editor/core/emoji";

  createBlockKit({ emoji: emoji({ limit: 24 }), codeBlock: codeBlock({ lowlight }) });
  createBlockKit({ codeBlock: CodeBlock.extend({ addNodeView }) });
  ```

- 67ef143: Media upload result mapping and display URLs (`@slash-editor/core`, `@slash-editor/react`):

  - **`toAttrs` option on `image`, `file`, and `video`.** Maps the adapter's full upload result onto node attrs (default `{ src: result.url }`) on the first success and on every retry, merged over the existing attrs — persist a server's canonical name/size/mime or id without reimplementing `retryImage`/`retryFile`/`retryVideo`. Also reachable through `createBlockKit({ image | file | video: { toAttrs } })`.
  - **Display-only `resolveSrc` option on `image`, `file`, `video`, and `embed`** (`embed` receives its stored `url`). Rewrites the URL a node view displays — signed URLs, files behind auth — while `getHTML()`, markdown, and JSON keep the canonical stored value. New `ResolveSrc` and `UploadToAttrs` types.
  - **`useResolvedSrc(src, node, resolveSrc)`** hook: sync results on the same render, async results once settled (stale results for a changed `src` are discarded), errors fall back to the stored URL. The registry `node-views` image/file/video/embed views apply it.

- fb434be: **`starterKit` option on `createBlockKit`.** Options are forwarded to Tiptap's `StarterKit`, so `createBlockKit({ starterKit: { underline: false } })` drops the underline mark (and `Mod-u` / `++text++` markdown) without reconfiguring the returned extension by hand. Keys the kit owns (`heading`, `undoRedo`, `link`, `codeBlock`, `blockquote`, `gapcursor`) are excluded from the `BlockKitStarterKitOptions` type; use `headingLevels`, `history`, `link`, and `codeBlock` for those.

### Patch Changes

- fa6359d: Keep the block handle inside the hover zone. `BlockDrag` now measures `gutterWidth` from the hovered block's left edge (or the editor box, whichever is further left) and defaults it to the new `BLOCK_GUTTER_WIDTH` (80px), which the registry `BlockHandle` lays itself out in — so the handle no longer vanishes on the way to it in an editor with little or no left padding. The geometry is exported as the pure `resolveHoverRect`.
- 2d5cdca: `unsetComment(threadId)` now removes the thread's anchors across the whole document instead of only the selection (new pure `removeCommentThread` helper), so `useComments().removeAnchor` works from a sidebar; it no longer focuses the editor.
- 1eaa2d9: Markdown import reads a mention or page link that starts a line as inline content. Such a paragraph (including one holding only the mention, or a list item, blockquote or callout line starting with one) used to import as literal comment text or be dropped entirely, so `serializeMarkdown` output with a leading mention did not round-trip.
- 1ecdd25: Bind `Mod-k` to `openLinkEditor`, matching the bubble toolbar's advertised `⌘K`. The key falls through when there is nothing to link; change or remove it with `linkEditor: { shortcut: "…" | false }`.

## 0.6.0

### Minor Changes

- 65f7886: Syntax-highlighted code blocks (`@slash-editor/core`):

  - **`codeBlock` option.** `createBlockKit({ codeBlock: {} })` swaps StarterKit's plain code block for `@tiptap/extension-code-block-lowlight` under the same `codeBlock` name, so block types, slash items, and markdown are unchanged. Opt-in; pass `lowlight` to choose grammars (default: lowlight's `common` set). `codeBlock: false` leaves it to a `CodeBlock.extend(...)` via `extend`.
  - **`CodeBlock` / `codeBlock()` exports**, plus the `code-block-node-view` registry item: a language selector and `hljs-*` token CSS themed from shadcn tokens.

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

## 0.5.1

### Patch Changes

- 552670e: Importing `@slash-editor/react` no longer throws `DOMRect is not defined` during SSR/prerender: the empty fallback anchor rect is created on first use instead of at module scope. Registry: `popover`/`dropdown-menu` now declare `@base-ui/react` and `cn`, and components import `cn` directly instead of `@/lib/utils`, so `shadcn add @slash-editor/slash-editor-kit` works in an app that never ran `shadcn init`.

## 0.5.0

### Minor Changes

- 48c593c: Document table of contents and read-only documents (`@slash-editor/core` 0.5.0, `@slash-editor/react` 0.5.0):

  - **`tableOfContents` extension.** The document outline — top-level headings with `id`, `level`, `text`, and a `pos` that addresses each node — computed on change and exposed as the same subscribe/store shape the other surfaces use. Pure helpers (`computeTableOfContents`, `findActiveItem`, `pickActiveByScroll`) stay DOM-free and unit-tested; `scrollToHeading(pos)` jumps to a heading. With no subscriber the extension never scans the document. `createBlockKit({ tableOfContents })` configures or opts it out.
  - **`useTableOfContents` hook and `table-of-contents` registry item.** Outline nav with an active row tracked from the caret while editing and from the scroll position otherwise; clicking a row jumps to its heading. Included in `slash-editor-kit`.
  - **Read-only documents.** Two new `createBlockKit` seams make a viewer (`useSlashEditor({ editable: false })`) interactive instead of dead weight: `link: { openOnClick: true }` for link navigation and `taskItem: { onReadOnlyChecked }` for checkboxes. Both keep today's behavior by default. The new `guides/read-only` page documents what else stays live and what goes inert.

## 0.4.0

### Minor Changes

- **feat(core,site)**: Mermaid diagram blocks. `@slash-editor/core` adds a `mermaid` node (source kept as document text, so collaborative edits merge per character) with `setMermaid`/`toggleMermaid`, ` ```mermaid ` / `~~~mermaid` input rules, a `mermaid` block type that feeds `/mermaid` and every "Turn into" menu, a `createBlockKit({ mermaid })` option, and ` ```mermaid ` fence markdown import/export. The new `mermaid-node-view` registry item renders the diagram in place, opens the source with a live preview while the caret is inside, themes diagrams from your shadcn tokens (light and dark), and lazy-loads `mermaid`.

  **Full Changelog**: https://github.com/buiducnhat/slash-editor/compare/v0.3.3...v0.4.0

## 0.3.3

### Patch Changes

- **feat(core)**: Expose `getDOMNode` on `BlockTarget` and export `toBlockTarget` helper for safe block DOM element resolution
- **feat(site)**: Add `BlockDragPreview` component with live DOM cloning, 60fps direct transforms, tactile styling, and subtle opacity during block dragging

  **Full Changelog**: https://github.com/buiducnhat/slash-editor/compare/v0.3.2...v0.3.3

## 0.3.2

### Patch Changes

- ## What's Changed
  - **fix(core)**: Support `taskItem` as a drag-and-reorder unit (`autoScroll` tree walker, `resolveBlockAt` predicate, `computeRects` filter)
  - **fix(site)**: Prevent block handle dropdown submenus from disappearing on hover via `DropdownMenuTrigger` overlay + `pointer-events-none` spacer

  **Full Changelog**: https://github.com/buiducnhat/slash-editor/compare/v0.3.1...v0.3.2

## 0.3.1

### Patch Changes

- Fix bubble toolbar flickering when opening Turn into or Ask AI dropdowns

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
