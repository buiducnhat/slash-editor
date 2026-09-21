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
packages/core/src/mention.ts              Mention node, async Suggestion provider, storage store
packages/core/src/slash-command.ts        SlashCommand extension, storage store, keyboard handling
packages/core/src/slash-items.ts          SlashItem type, filterSlashItems(), defaultSlashItems
packages/core/src/table.ts                table(): configures @tiptap/extension-table's TableKit
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

demo-react/                   playground, docs target, future registry host
  server/collab-server.ts     Hocuspocus self-host recipe: Hocuspocus class bridged to Bun.serve via crossws
  server/tsconfig.json        Bun types scope, separate from the browser app's tsconfig
  index.html                  entry, `class="dark"` on <html>
  vite.config.ts              react + tailwind plugins, workspace source aliases
  components.json             shadcn config: base UI, nova preset, lucide icons
  src/main.tsx                React root, StrictMode on
  src/app.tsx                 page shell: SoloApp (default) / CollabApp (`?collab=<room>` opt-in)
  src/components/slash-menu.tsx  Command + Popover surface, icon-key mapping
  src/components/bubble-toolbar.tsx  Popover-anchored mark toggle row
  src/components/comment-panel.tsx   sidebar: useComments + CommentThreadStore, compose/resolve/reopen
  src/components/presence-avatars.tsx  usePresence() as a row of colored initials with a Tooltip
  src/components/mention-menu.tsx    Command + Popover surface for @-mentions, loading row
  src/components/link-editor-popover.tsx  Input-driven popover: href, Open/Remove when editing
  src/components/nodes/uploadable-node-view.tsx  shared placeholder/progress/error chrome for image/file/video
  src/components/nodes/image-node-view.tsx   ReactNodeViewRenderer target for Image
  src/components/nodes/file-node-view.tsx    ReactNodeViewRenderer target for File
  src/components/nodes/video-node-view.tsx   ReactNodeViewRenderer target for Video
  src/components/nodes/embed-node-view.tsx   ReactNodeViewRenderer target for Embed: URL input, bookmark/iframe
  src/components/nodes/ai-block-node-view.tsx  ReactNodeViewRenderer target for AiBlock: stream/Keep/Discard/Try again
  src/components/ui/*.tsx     shadcn components (added via CLI, owned by the repo)
  src/lib/utils.ts            re-exports cn from the `cn` package
  src/lib/collaboration.ts    createDemoCollaboration(): shared Y.Doc + HocuspocusProvider per room
  src/lib/comment-store.ts    createMockCommentThreadStore(): in-memory CommentThreadStore
  src/lib/upload-adapter.ts   mockUploadAdapter: data-URL upload, `fail-`-prefixed names reject once
  src/lib/mention-provider.ts mockMentionProvider: filters an in-memory directory after a delay
  src/lib/stream-adapter.ts   mockStreamAdapter: per-action canned response, `trigger-ai-error` fails once
  src/styles.css              Tailwind v4 entry, theme tokens, .slash-content rules
  playwright.config.ts        Playwright config: testDir tests/e2e, webServer runs `bun run dev` + `collab:server`
  tests/e2e/support.ts        dragBlock(), pasteHtml(), focusTrailingParagraph() helpers
  tests/e2e/insert.spec.ts    slash menu: alias insert, Escape, popover close
  tests/e2e/reorder.spec.ts   gutter-handle drag reorders a sibling
  tests/e2e/nest.spec.ts      rightward drag nests a block inside a list item
  tests/e2e/paste-notion.spec.ts        Notion clipboard HTML normalization
  tests/e2e/paste-google-docs.spec.ts   Google Docs clipboard HTML normalization
  tests/e2e/media-upload.spec.ts        image upload: placeholder → uploading → ready, and error → retry → ready
  tests/e2e/structure.spec.ts           table/columns/embed insertion via the slash menu
  tests/e2e/mention.spec.ts             async filter, chip insertion, empty state, Escape
  tests/e2e/link-editor.spec.ts         create over a selection, click-to-edit, remove
  tests/e2e/ai-actions.spec.ts          slash action → stream → keep/discard, and error → retry
  tests/e2e/collab.spec.ts              two browsers converge + reconnect after offline edits; comment sidebar flow

docs/                         this documentation set
tsconfig.json                 shared base config + workspace path aliases
vite.config.ts                vite-plus config: pack, lint, fmt, staged hooks, vitest excludes demo-react/tests/e2e
```

## Entry points

| Purpose          | Path                                                       |
| ---------------- | ---------------------------------------------------------- |
| Core public API  | `packages/core/src/index.ts`                               |
| React public API | `packages/react/src/index.ts`                              |
| Demo application | `demo-react/src/main.tsx` → `src/app.tsx`                  |
| Toolchain config | `vite.config.ts` (root), `demo-react/vite.config.ts` (app) |

## Generated and ignored

`dist/` in each package (built by `vp pack`), `node_modules/` (bun isolated linker: packages have their own `node_modules`). Nothing else is generated into the tree — declarations must never appear beside `packages/core/src/*.ts`; if they do, a build resolved core through the source alias.

`demo-react/test-results/`, `demo-react/playwright-report/`, `demo-react/.last-run.json` (Playwright run artifacts, gitignored).
