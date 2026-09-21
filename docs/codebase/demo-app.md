# Demo Application

`demo-react` is the playground, the manual-test surface, the docs site (`/docs`, `/docs/:item`), and the shadcn registry host (`/r/[name].json`, built from `registry.json` by `shadcn build`).

## Stack

| Piece      | Version / choice                                                            |
| ---------- | --------------------------------------------------------------------------- |
| React      | 19.3 with StrictMode enabled                                                |
| Bundler    | Vite (`vp dev` / `vp build`) + `@vitejs/plugin-react`                       |
| CSS        | Tailwind v4 via `@tailwindcss/vite`, entry `src/styles.css`                 |
| Components | shadcn, `base` primitives (`@base-ui/react`), `nova` preset, `lucide` icons |

`components.json` records that configuration; `bunx --bun shadcn@latest add <component>` writes into `src/components/ui/`.

## Structure

- `src/app.tsx` — page shell, seeded document, `DocumentStats` (rendered only once the editor exists, so `useEditorState` subscribes to a live instance), `<SlashMenu>`, `<BlockHandle>`, `<TopNav>`, and the router switch (`App`) between the playground (`/`, `?collab=<room>`) and the docs site (`/docs`).
- `src/lib/router.tsx` — `usePathname`/`navigate`/`Link`: a small pushState router, no new dependency.
- `src/routes/` — the docs site: `docs-app.tsx` (sidebar shell), `docs-overview.tsx` (install-everything + item list), `docs-item.tsx` (one live, isolated demo editor per registry item).
- `demo-react/registry.json` + `src/lib/registry-items.ts` — the former is `shadcn build`'s input (`registry:build` script → `public/r/*.json`); the latter is docs-page copy, kept separate on purpose (see the file's own comment).
- `src/components/slash-menu.tsx` — the slash surface; the only place icons and markup for the menu are decided.
- `src/components/block-handle.tsx` — the gutter surface: hover handle (insert-below + drag/click grip), drop indicator, and the block context menu (Duplicate/Delete) opened by a grip click that stays under the drag threshold.
- `src/lib/node-view-extensions.tsx` — `nodeViewExtensions()`: the one place `mockUploadAdapter` is wired into `image`/`file`/`video`'s `NodeView`s (as a prop, so the node-view files themselves stay registry-safe); also swaps in `embed`/`aiBlock`'s `NodeView`s.
- `src/components/nodes/` — M2 `NodeView`s registered via `ReactNodeViewRenderer`: `uploadable-node-view.tsx` (shared placeholder/progress/error chrome for image/file/video, `adapter` taken as a prop), `image-node-view.tsx`/`file-node-view.tsx`/`video-node-view.tsx` (thin wrappers, also take `adapter` as a prop), `embed-node-view.tsx` (URL input, no adapter).
- `src/lib/upload-adapter.ts` — `mockUploadAdapter`: data-URL upload with a simulated delay; `fail-`-prefixed file names reject once, so the retry path has something real to recover from.
- `src/components/ui/` — shadcn output. Local modifications: `popover.tsx` and `dropdown-menu.tsx` both forward an `anchor` prop to their `Positioner`, required to anchor a surface at the caret or a block's rect instead of a trigger element.
- `src/styles.css` — preset theme tokens plus a `.slash-content` component layer that styles editor output with plain element selectors.
- `src/main.tsx` — wraps `<App>` in `TooltipProvider` (`delay={400}`), required by every icon-only button in the gutter.

## Aliases

`vite.config.ts` maps `@slash-editor/core` and `@slash-editor/react` to package sources (HMR across the workspace) and `@` to `src`. `tsconfig.json` mirrors those paths.

## Running

```bash
vp run -F demo-react dev      # http://localhost:5173
vp run -F demo-react build
cd demo-react && bun run registry:build   # public/r/*.json from registry.json
```
