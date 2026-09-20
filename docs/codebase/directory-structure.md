# Directory Structure

```
packages/core/                @slash-editor/core
  src/index.ts                public exports
  src/block-kit.ts            createBlockKit(): baseline extension set
  src/slash-command.ts        SlashCommand extension, storage store, keyboard handling
  src/slash-items.ts          SlashItem type, filterSlashItems(), defaultSlashItems
  tests/block-kit.test.ts     schema inventory, JSON round trip, kit options
  tests/slash-items.test.ts   ranking, keyword shorthands, `when` gating
  tests/tsconfig.json         type-checks tests without widening the build rootDir
  tsconfig.json               build scope: src only

packages/react/               @slash-editor/react
  src/index.ts                public exports + curated @tiptap/react re-exports
  src/use-slash-editor.ts     useSlashEditor(): editor lifecycle and defaults
  src/use-slash-menu.ts       useSlashMenu(): store subscription + caret anchor
  tsconfig.json               resolves core via ../core/dist/index.d.mts

demo-react/                   playground, docs target, future registry host
  index.html                  entry, `class="dark"` on <html>
  vite.config.ts              react + tailwind plugins, workspace source aliases
  components.json             shadcn config: base UI, nova preset, lucide icons
  src/main.tsx                React root, StrictMode on
  src/app.tsx                 page shell, editor, DocumentStats
  src/components/slash-menu.tsx  Command + Popover surface, icon-key mapping
  src/components/ui/*.tsx     shadcn components (added via CLI, owned by the repo)
  src/lib/utils.ts            re-exports cn from the `cn` package
  src/styles.css              Tailwind v4 entry, theme tokens, .slash-content rules

docs/                         this documentation set
tsconfig.json                 shared base config + workspace path aliases
vite.config.ts                vite-plus config: pack, lint, fmt, staged hooks
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
