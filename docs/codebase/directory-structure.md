# Directory Structure

```
packages/core/src/index.ts                public exports
packages/core/src/ai-block.ts             AiBlock transient node, StreamAdapter contract, createAiSlashItems()
packages/core/src/block-kit.ts            createBlockKit(): baseline extension set
packages/core/src/bubble-toolbar.ts       BubbleToolbar extension, storage store, selection-driven visibility
packages/core/src/callout.ts              Callout node: content block+, wrapIn/toggleWrap/lift commands
packages/core/src/collaboration.ts        collaboration(): wraps Tiptap's Collaboration/CollaborationCaret over y-prosemirror
packages/core/src/columns.ts              Columns/Column container nodes, setColumns() command
packages/core/src/comment.ts              Comment mark (threadId anchor), activeThreadIds(), CommentThreadStore contract
packages/core/src/embed.ts                Embed node: bookmark/iframe, setEmbed() command, no adapter
packages/core/src/file.ts                 File node: upload/retry shape, download-link rendering
packages/core/src/image.ts                Image node: upload/retry shape, empty-placeholder state
packages/core/src/link-editor.ts          LinkEditor extension: popover visibility + draft href only
packages/core/src/markdown.ts             @slash-editor/core/markdown entry: Markdown extension, serializeMarkdown()/parseMarkdown()
packages/core/src/markdown-syntax.ts      dependency-free marker/link/block-scan helpers nodes use for their markdown hooks
packages/core/src/mention.ts              Mention node, async Suggestion provider, storage store
packages/core/src/slash-command.ts        SlashCommand extension, storage store, keyboard handling
packages/core/src/slash-items.ts          SlashItem type, filterSlashItems(), defaultSlashItems
packages/core/src/table.ts                table(): configures @tiptap/extension-table's TableKit
packages/core/src/quote.ts                Blockquote with the `"` shorthand (StarterKit's `>` rule is disabled)
packages/core/src/toggle.ts               Toggle node: Details + `level` attr, `>` and `# >` shorthands, setToggle()
packages/core/src/upload.ts               UploadAdapter contract, runUpload/retryUpload, PendingUploadRegistry
packages/core/src/video.ts                Video node: upload/retry shape
packages/core/tests/ai-block.test.ts      schema defaults/JSON round trip, opt-in wiring, createAiSlashItems
packages/core/tests/block-kit.test.ts     schema inventory, JSON round trip, kit options
packages/core/tests/block-nodes.test.ts   callout/task-item/details attribute defaults and JSON round trips
packages/core/tests/bubble-toolbar.test.ts  default items, `when` gating, `isActive` per mark
packages/core/tests/collaboration.test.ts opt-in wiring, forced history:false, field default/override
packages/core/tests/comment.test.ts       schema round trip, excludes stacking, activeThreadIds pure function
packages/core/tests/link-editor.test.ts   canOpenLinkEditor gating, kit opt-out, link mark config
packages/core/tests/media-nodes.test.ts   image/file/video/embed attribute defaults and JSON round trips
packages/core/tests/mention.test.ts       schema defaults/JSON round trip, opt-in wiring, option pass-through
packages/core/tests/slash-items.test.ts   ranking, keyword shorthands, `when` gating
packages/core/tests/table-columns.test.ts table/columns schema inventory, columns{2,} minimum
packages/core/tests/upload.test.ts        findNodeById, PendingUploadRegistry
packages/core/tests/tsconfig.json         type-checks tests without widening the build rootDir
packages/core/tsconfig.json               build scope: src only

packages/react/               @slash-editor/react
  src/index.ts                public exports + curated @tiptap/react re-exports
  src/use-slash-editor.ts     useSlashEditor(): editor lifecycle and defaults
  src/use-slash-menu.ts       useSlashMenu(): store subscription + caret anchor
  src/use-bubble-toolbar.ts   useBubbleToolbar(): store subscription + selection anchor
  src/use-comments.ts         useComments(): store subscription + CommentThreadStore composition
  src/use-link-editor.ts      useLinkEditor(): store subscription + confirm/remove composed over core commands
  src/use-mention.ts          useMention(): store subscription + caret anchor, same shape as useSlashMenu plus loading
  src/use-presence.ts         usePresence(): awareness state -> peer list, cached/event-driven
  tsconfig.json               resolves core via ../core/dist/index.d.mts

site/                          the one app: playground, docs site, landing page, and the shadcn registry host (Next.js + Fumadocs)
  next.config.mjs              fumadocs-mdx plugin
  source.config.ts             Config API: `docs` collection over `content/docs`, persisted to `.source/` so `tsc` sees real page types outside a live `next dev`/`next build`
  tsconfig.json                `@/*` → `./registry/*` (registry component internals resolve unchanged), `~/*` → `./*` (site's own modules)
  components.json              shadcn config: base UI, nova preset, lucide icons — `tailwind.css: app/globals.css`
  registry.json                shadcn registry manifest: granular items + `slash-editor-kit` umbrella block, file paths under `registry/`
  scripts/prebuild.ts          `shadcn build` into `public/r/`; runs via `build:prepare` before `next build`
  registry/                    the registry component source `shadcn build`/`shadcn add` ships — this repo's UI, owned and edited directly
    components/slash-menu.tsx  Command + Popover surface, icon-key mapping
    components/bubble-toolbar.tsx  Popover-anchored mark toggle row
    components/block-handle.tsx    gutter hover handle, drag/click grip, drop indicator, block context menu
    components/comment-panel.tsx   sidebar: useComments + CommentThreadStore, compose/resolve/reopen
    components/presence-avatars.tsx  usePresence() as a row of colored initials with a Tooltip
    components/mention-menu.tsx    Command + Popover surface for @-mentions, loading row
    components/link-editor-popover.tsx  Input-driven popover: href, Open/Remove when editing
    components/nodes/uploadable-node-view.tsx  shared placeholder/progress/error chrome for image/file/video; `adapter` passed as a prop, never imported
    components/nodes/image-node-view.tsx   ReactNodeViewRenderer target for Image; takes `adapter` as a prop
    components/nodes/file-node-view.tsx    ReactNodeViewRenderer target for File; takes `adapter` as a prop
    components/nodes/video-node-view.tsx   ReactNodeViewRenderer target for Video; takes `adapter` as a prop
    components/nodes/embed-node-view.tsx   ReactNodeViewRenderer target for Embed: URL input, bookmark/iframe
    components/nodes/ai-block-node-view.tsx  ReactNodeViewRenderer target for AiBlock: stream/Keep/Discard/Try again
    components/ui/*.tsx        shadcn components (added via CLI, owned by the repo); `popover.tsx`/`dropdown-menu.tsx` forward `anchor` for caret/block-rect positioning
    lib/utils.ts               re-exports cn from the `cn` package
    lib/node-view-extensions.tsx  nodeViewExtensions(): the one place `mockUploadAdapter` is wired into image/file/video
    lib/use-demo-editor.ts     useSlashEditor + shared editor defaults: the lucide chevron for every toggle
    lib/fake-presence.ts       createFakePresenceProvider(): static awareness for the presence-avatars demo
    lib/collaboration.ts       createDemoCollaboration(): shared Y.Doc + HocuspocusProvider per room
    lib/comment-store.ts       createMockCommentThreadStore(): in-memory CommentThreadStore
    lib/upload-adapter.ts      mockUploadAdapter: data-URL upload, `fail-`-prefixed names reject once
    lib/mention-provider.ts    mockMentionProvider: filters an in-memory directory after a delay
    lib/stream-adapter.ts      mockStreamAdapter: per-action canned response, `trigger-ai-error` fails once
    theme.css                  Nova design tokens: base scale, dark-mode overrides, `@theme inline` mapping
    slash-content.css          `.slash-content` component layer — the only class name the editor core relies on
  server/collab-server.ts      Hocuspocus self-host recipe: Hocuspocus class bridged to Bun.serve via crossws
  server/tsconfig.json         Bun types scope, separate from the app's own tsconfig
  app/layout.tsx                RootProvider + TooltipProvider (registry components need a Tooltip ancestor)
  app/globals.css               Tailwind v4 entry: fumadocs preset, then `registry/theme.css` + `registry/slash-content.css`
  app/(home)/layout.tsx         HomeLayout (shared nav: Docs/Playground/GitHub, search, theme toggle) for landing + playground
  app/(home)/page.tsx           landing page: hero with a live `SlashMenuDemo`, feature grid, install snippet
  app/(home)/playground/page.tsx  the playground route: solo editor, or `?collab=<room>` via `RoomJoinForm`
  app/docs/layout.tsx           DocsLayout: sidebar/TOC from `lib/source.ts`'s page tree
  app/docs/[[...slug]]/page.tsx MDX page renderer
  app/api/search/route.ts       Fumadocs search endpoint
  lib/source.ts                 `loader()` over the generated `docs` collection
  lib/layout.shared.tsx         shared nav links: Docs, Playground, GitHub
  components/mdx.tsx            MDX component defaults: Tabs, AutoTypeTable (ts-morph generator)
  components/registry/component-preview.tsx  `<ComponentPreview name="…">`: reads `registry/components/*` from disk for the Code tab, `children` is the live Preview
  components/registry/install-command.tsx    `<InstallCommand item="…">` and `<RegistrySnippet />`
  components/demo/registry-demos.tsx          one demo per registry item, wiring the same editor defaults the playground uses
  components/demo/registry-demos.preview.tsx  `next/dynamic(…, { ssr: false })` wrapper per demo — ProseMirror needs a real DOM
  components/playground/playground-editor.tsx  SoloEditor / CollabEditor, ported from the former standalone app's `app.tsx`
  components/playground/markdown-panel.tsx     solo editor's "Markdown" panel: live `getMarkdown()`, edit + apply, import/download `.md`
  components/playground/playground-editor.preview.tsx  `ssr: false` wrapper — same DOM-globals constraint as the demo previews
  components/landing/feature-grid.tsx         landing page feature cards
  content/docs/**/*.mdx         getting-started/, components/ (one per registry item + the kit), guides/, api/
  playwright.config.ts          testDir tests/e2e, webServer runs `bun run dev` + `collab:server`
  tests/e2e/support.ts          dragBlock(), pasteHtml(), focusTrailingParagraph() helpers
  tests/e2e/insert.spec.ts      slash menu: alias insert, Escape, popover close
  tests/e2e/reorder.spec.ts     gutter-handle drag reorders a sibling
  tests/e2e/nest.spec.ts        rightward drag nests a block inside a list item
  tests/e2e/paste-notion.spec.ts        Notion clipboard HTML normalization
  tests/e2e/paste-google-docs.spec.ts   Google Docs clipboard HTML normalization
  tests/e2e/media-upload.spec.ts        image upload: placeholder → uploading → ready, and error → retry → ready
  tests/e2e/structure.spec.ts           table/columns/embed insertion via the slash menu
  tests/e2e/mention.spec.ts             async filter, chip insertion, empty state, Escape
  tests/e2e/link-editor.spec.ts         create over a selection, click-to-edit, remove
  tests/e2e/ai-actions.spec.ts          slash action → stream → keep/discard, and error → retry
  tests/e2e/toggle-blocks.spec.ts       `>`/`"` shorthands, toggle headings, level survives open/close
  tests/e2e/collab.spec.ts              two browsers converge + reconnect after offline edits; comment sidebar flow
.github/workflows/release.yml tag-triggered (`v*`) publish: build, `vp check`, registry schema gate, `bun publish` core then react
docs/                         this documentation set
tsconfig.json                 shared base config + workspace path aliases
vite.config.ts                vite-plus config: pack, lint, fmt, staged hooks, vitest excludes site/tests/e2e
```

## Entry points

| Purpose                   | Path                                                            |
| ------------------------- | --------------------------------------------------------------- |
| Core public API           | `packages/core/src/index.ts`                                    |
| Core markdown subpath     | `packages/core/src/markdown.ts` → `@slash-editor/core/markdown` |
| React public API          | `packages/react/src/index.ts`                                   |
| Playground                | `site/app/layout.tsx` → `app/(home)/playground/page.tsx`        |
| Docs site + landing       | `site/app/layout.tsx` → `app/(home)/page.tsx` / `app/docs/**`   |
| Registry component source | `site/registry/components/*`                                    |
| Toolchain config          | `vite.config.ts` (root), `site/next.config.mjs`                 |

## Generated and ignored

`dist/` in each package (built by `vp pack`), `node_modules/` (bun isolated linker: packages have
their own `node_modules`), `site/public/r/*.json` (built by `shadcn build` from `site/registry.json`

- `site/registry/**`, run by `site/scripts/prebuild.ts`) — gitignored, never edit directly.
  `site/.source/` and `site/.next/` are fumadocs-mdx/Next build artifacts.

Nothing else is generated into the tree — declarations must never appear beside
`packages/core/src/*.ts`; if they do, a build resolved core through the source alias.

`site/test-results/`, `site/playwright-report/`, `site/.last-run.json` (Playwright run artifacts,
gitignored).
