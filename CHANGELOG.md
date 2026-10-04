# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- `bun run version-packages` adds each release's section from its changesets; edit it in the Version Packages PR. -->

## [0.7.0] — 2026-10-04

Keep the block handle inside the hover zone. `BlockDrag` now measures `gutterWidth` from the hovered block's left edge (or the editor box, whichever is further left) and defaults it to the new `BLOCK_GUTTER_WIDTH` (80px), which the registry `BlockHandle` lays itself out in — so the handle no longer vanishes on the way to it in an editor with little or no left padding. The geometry is exported as the pure `resolveHoverRect`.

`unsetComment(threadId)` now removes the thread's anchors across the whole document instead of only the selection (new pure `removeCommentThread` helper), so `useComments().removeAnchor` works from a sidebar; it no longer focuses the editor.

Emoji and highlighted code blocks move to their own entries (`@slash-editor/core`, `@slash-editor/react`):

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

Markdown import reads a mention or page link that starts a line as inline content. Such a paragraph (including one holding only the mention, or a list item, blockquote or callout line starting with one) used to import as literal comment text or be dropped entirely, so `serializeMarkdown` output with a leading mention did not round-trip.

Bind `Mod-k` to `openLinkEditor`, matching the bubble toolbar's advertised `⌘K`. The key falls through when there is nothing to link; change or remove it with `linkEditor: { shortcut: "…" | false }`.

Media upload result mapping and display URLs (`@slash-editor/core`, `@slash-editor/react`):

- **`toAttrs` option on `image`, `file`, and `video`.** Maps the adapter's full upload result onto node attrs (default `{ src: result.url }`) on the first success and on every retry, merged over the existing attrs — persist a server's canonical name/size/mime or id without reimplementing `retryImage`/`retryFile`/`retryVideo`. Also reachable through `createBlockKit({ image | file | video: { toAttrs } })`.
- **Display-only `resolveSrc` option on `image`, `file`, `video`, and `embed`** (`embed` receives its stored `url`). Rewrites the URL a node view displays — signed URLs, files behind auth — while `getHTML()`, markdown, and JSON keep the canonical stored value. New `ResolveSrc` and `UploadToAttrs` types.
- **`useResolvedSrc(src, node, resolveSrc)`** hook: sync results on the same render, async results once settled (stale results for a changed `src` are discarded), errors fall back to the stored URL. The registry `node-views` image/file/video/embed views apply it.

**`starterKit` option on `createBlockKit`.** Options are forwarded to Tiptap's `StarterKit`, so `createBlockKit({ starterKit: { underline: false } })` drops the underline mark (and `Mod-u` / `++text++` markdown) without reconfiguring the returned extension by hand. Keys the kit owns (`heading`, `undoRedo`, `link`, `codeBlock`, `blockquote`, `gapcursor`) are excluded from the `BlockKitStarterKitOptions` type; use `headingLevels`, `history`, `link`, and `codeBlock` for those.

## [0.6.0] — 2026-10-04

Syntax-highlighted code blocks (`@slash-editor/core`):

- **`codeBlock` option.** `createBlockKit({ codeBlock: {} })` swaps StarterKit's plain code block for `@tiptap/extension-code-block-lowlight` under the same `codeBlock` name, so block types, slash items, and markdown are unchanged. Opt-in; pass `lowlight` to choose grammars (default: lowlight's `common` set). `codeBlock: false` leaves it to a `CodeBlock.extend(...)` via `extend`.
- **`CodeBlock` / `codeBlock()` exports**, plus the `code-block-node-view` registry item: a language selector and `hljs-*` token CSS themed from shadcn tokens.

Emoji picker (`@slash-editor/core`, `@slash-editor/react`):

- **`emoji` extension.** Wraps `@tiptap/extension-emoji` (MIT) with a `:`-triggered picker that exposes the same subscribe/state shape as `mention`. `:shortcode:` input and paste rules, unicode-to-node conversion, and markdown (`:shortcode:`, unknown shortcodes stay text) are included. Opt-in: `createBlockKit({ emoji: {} })`.
- **`/emoji` slash item.** Shown only while the node is registered; types the `:` that opens the picker.
- **`useEmoji` hook and `emoji-menu` registry item.** Command-in-Popover surface that follows the `mention-menu` pattern. Included in `slash-editor-kit`.

Localization (`@slash-editor/core`, `@slash-editor/react`):

- **`messages` option on `createBlockKit`.** Overrides slash item, block type, and AI action text by id (`title`, `description`, `aliases`, `keywords`), slash menu group headings, the slash hint, empty-block placeholders, block menu titles, and bubble toolbar labels. Partial translations keep English for everything left out; the existing `slash.hint` and `placeholder.text` options still win.
- **`localizeItems`, `localizeBlockMenuItems`, `localizeBubbleToolbarItems`** helpers, the `messages` extension, and `editor.storage.messages`.
- **`useBlockMenu`** returns translated titles. The registry `block-handle` and `bubble-toolbar` now read block types from `useBlockTypes` so translated titles reach their menus.
- **Pages and uploads.** `untitledPage` and `uploadFailed` messages; `pageTitle`, `pages` and `withPageMentions` take an optional `untitled` argument. `/page` and `/link to page` are translated through `items`/`groups`.

Pages (`@slash-editor/core`, `@slash-editor/react`):

- **`subPage` block and `pageLink` inline node.** Each carries only a `pageId`; titles, icons and the tree live in a host-owned `PageStore`. Opt-in: `createBlockKit({ pages: { store, currentPageId, onNavigate } })`. Adds `/page` and `/link to page`, and merges page results into the `@` menu (`MentionItem.kind: "page"`).
- **Detach/attach reporting.** `onSubPagesDetached`/`onSubPagesAttached` report local deletes, undo and paste; moves and remote edits stay silent. Duplicating or pasting a sub-page owned elsewhere becomes a `pageLink`.
- **Helpers.** `collectPageRefs`, `getPagesOptions`, `pageTitle`, a `nodeViews` option for UI layers, and markdown export/import of both nodes.
- **React hooks.** `usePage`, `usePageTree`, `useBreadcrumb` and `useBacklinks` read a `PageStore` with no editor.

## [0.5.1] — 2026-09-30

SSR-safe import and self-contained registry installs (`@slash-editor/core` 0.5.1, `@slash-editor/react` 0.5.1):

- **SSR-safe `@slash-editor/react`.** Importing the package no longer throws `DOMRect is not defined` during SSR/prerender: the empty fallback anchor rect is created on first use instead of at module scope.
- **Self-contained registry installs.** `popover`/`dropdown-menu` declare `@base-ui/react` and `cn`, and components import `cn` directly instead of `@/lib/utils`, so `shadcn add @slash-editor/slash-editor-kit` works in an app that never ran `shadcn init`.

## [0.5.0] — 2026-09-29

Document outline and read-only documents (`@slash-editor/core` 0.5.0, `@slash-editor/react` 0.5.0):

- **`tableOfContents` extension.** The document outline — top-level headings with their `id`, `level`, `text`, and a `pos` that addresses each node — recomputed on change and exposed through the same subscribe/store shape the other surfaces use. `computeTableOfContents`, `findActiveItem`, and `pickActiveByScroll` are pure and DOM-free; `scrollToHeading(pos)` pins a heading to the top of its scroll container. Nothing is scanned while no outline is mounted, and `createBlockKit({ tableOfContents })` configures or opts it out.
- **`useTableOfContents` hook and `table-of-contents` registry item.** The active row follows the caret while editing and the scroll position otherwise; clicking a row moves the caret to that heading and jumps to it. Included in `slash-editor-kit`.
- **Read-only documents.** Two new `createBlockKit` seams keep a viewer interactive: `link: { openOnClick: true }` for link navigation and `taskItem: { onReadOnlyChecked }` for checkboxes. The gutter now stands down with the document, and a new **Read-Only Documents** guide lists what else goes inert.
- **Playground.** The outline and a **Read-only** switch, with the comment panel moved into a shared right rail.

## [0.4.0] — 2026-09-28

Mermaid diagram blocks (`@slash-editor/core` 0.4.0, `@slash-editor/react` 0.4.0):

- **`mermaid` node.** Diagram source is document text, so collaborative edits merge per character. Insert with `/mermaid`, ` ```mermaid ` + space, or `~~~mermaid` + Enter, or convert any text block through "Turn into". `createBlockKit({ mermaid })` configures or opts it out.
- **Markdown.** Diagrams export as ` ```mermaid ` fences (GitHub renders them) and import back as diagrams; other fences stay code blocks.
- **`mermaid-node-view` registry item.** Rendered diagram by default, source with a live preview while the caret is inside, parse errors under the last good render, colours from your shadcn tokens with light/dark re-render, `mermaid` lazy-loaded on first render. Included in `slash-editor-kit`.

## [0.3.3] — 2026-09-26

Block drag ghost preview card and DOM element lookup (`@slash-editor/core` 0.3.3, `@slash-editor/react` 0.3.3):

- **Tactile block drag preview card.** Dragging a block now renders a floating card following the pointer with live DOM cloning, 60fps direct transforms, typography/theme fidelity through `.slash-content`, subtle opacity, and gradient fade for long blocks.
- **Expose `BlockTarget.getDOMNode`.** Core now provides `getDOMNode()` on `BlockTarget` alongside `toBlockTarget` export for safe headless block DOM element access.

## [0.3.2] — 2026-09-25

Drag reorder for task items and block menu hover stability (`@slash-editor/core` 0.3.2, `@slash-editor/react` 0.3.2):

- **Support `taskItem` as a drag unit.** Auto-scroll tree walker, block target resolution, and rect computation now properly recognize `taskItem` in task lists.
- **Stabilize block handle submenus.** Prevent dropdown submenus from disappearing prematurely on hover.

## [0.3.1] — 2026-09-25

Bubble toolbar dropdown focus fix (`@slash-editor/core` 0.3.1, `@slash-editor/react` 0.3.1):

- **Prevent bubble toolbar flickering on dropdown open.** Clicking into "Turn into" (`BlockTypeDropdown`)
  or "Ask AI" (`AskAiDropdown`) no longer dismisses and re-opens the bubble toolbar. Core's
  `computeState` and `onBlur` now retain visibility when focus transitions to toolbar popover or
  dropdown menu controls (`[data-slot="dropdown-menu-content"]`, `[data-slot="popover-content"]`,
  `[role="menu"]`), and dropdown menus are rendered non-modal (`modal={false}`).

## [0.3.0] — 2026-09-25

Unified action registries, AI storage, and comment composer (`@slash-editor/core` 0.3.0,
`@slash-editor/react` 0.3.0):

- **Unified block types.** `defaultBlockTypes` in core acts as the single source of truth for
  slash command blocks, bubble toolbar block-type switcher, and the block handle "Turn into"
  menu.
- **Centralized AI extension.** `ai` extension now lives on editor storage, holding the configured
  `StreamAdapter` and `AiAction` items across slash, selection, and block contexts.
  `runAiAction` defaults to storage adapter and tracks mapped source ranges, supporting both
  `Replace` and `Insert below` actions.
- **Integrated comment store & composer.** `CommentThreadStore` registers via `comment({ store })`
  with required `subscribe(listener)` updates. An inline `CommentComposer` popover attaches to the
  bubble toolbar and syncs with the comment sidebar panel.
- **Headless React bindings & clean cutover.** Added `useBlockTypes`, `useAiActions`, `useBlockMenu`,
  unified `VirtualAnchor`, and updated `useComments`. Deleted empty directories in `@slash-editor/react`.

## [0.2.1] — 2026-09-24

One block-gutter fix in the shared core (`@slash-editor/core` 0.2.1, `@slash-editor/react`
0.2.1):

- **The gutter handle no longer sticks to the viewport on scroll.** `BlockDrag` cached block
  rects in viewport coordinates and only invalidated them on a doc update, so a scroll left
  both the hover match and the rect the gutter is positioned from stale: the handle held its
  place on screen while its block moved away. Any scroll — the page, an ancestor, or a drag's
  own auto-scroll — now invalidates the rects and re-resolves hover and drop from the last
  pointer position, coalesced to one frame. A still pointer therefore re-targets whichever
  block scrolls under it, and a drag's drop indicator tracks the pointer through auto-scroll.

## [0.2.0] — 2026-09-23

Markdown import/export (`@slash-editor/core` 0.2.0, `@slash-editor/react` 0.2.0):

- **New `@slash-editor/core/markdown` entry.** `markdown()` adds `editor.getMarkdown()` and
  `setContent(md, { contentType: "markdown" })`; `serializeMarkdown`/`parseMarkdown` do the
  same without an editor or a DOM. A separate entry, so `marked` (~20 KB gzipped) stays out of
  bundles that never import it.
- **GitHub-flavoured output that round-trips.** Callouts become `> [!TIP]`-style alerts, toggles
  `<details>`, and columns, media metadata, and mention ids ride in `<!-- slash:… -->` comments
  GitHub hides. AI drafts and unfinished uploads are left out; comment anchors keep their text.
- **Playground.** A Markdown panel mirrors the document live, and imports/downloads `.md` files.

## [0.1.1] — 2026-09-23

Two block-chrome fixes, both in the shared core (`@slash-editor/core` 0.1.1,
`@slash-editor/react` 0.1.1):

- **No gap cursor.** StarterKit's `gapcursor` is off, so clicking the strip a block's
  margin leaves between it and its neighbour focuses the nearest line instead of placing
  a cursor in the void that turned the next keystroke into a block of its own. Toggles
  hit this most, since `details` is `isolating` and ProseMirror offers a gap cursor on
  every isolated block's boundary.
- **The gutter handle rides the block's first line.** `BlockTarget.getClientRect` used to
  report the block's whole box, and the hover controls are centred on it — so a tall
  block (a multi-line column, a table, an expanded toggle) parked `+`/grip halfway down
  its height. It now measures the block's first text line, padding included, falling back
  to the block's own line box when there is no text to measure (a rule, a ready image).

## [0.1.0] — 2026-09-22

Initial documented release. M0–M7 shipped:
slash menu, block ids, drag handle, media/upload, mentions/AI, real-time collaboration,
npm packages (`@slash-editor/core`, `@slash-editor/react`), shadcn registry, docs site,
and playground.

Toggle blocks gained caret navigation, an exit from the body, and per-line gutter handles:

- `Enter` on a toggle title hands the caret to the body — into a fresh toggle's empty
  placeholder line, or a new block on top of an existing body — reopening a collapsed
  toggle first; `Enter` on an empty last body block leaves the toggle into a new paragraph
  after it.
- `ArrowDown` leaves the body from its last block (and a collapsed toggle from its title);
  `ArrowUp` on the first body block returns to the end of the title.
- A toggle body's blocks are drag units: each line gets its own hover handle, and
  move/duplicate/delete act on that line instead of the whole toggle.
- A toggle's own gutter handle anchors to its title line rather than the centre of its
  expanded body.
