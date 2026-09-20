# Demo Application

`demo-react` is the playground, the manual-test surface, and the future host for the shadcn registry (`/r/[name].json`).

## Stack

| Piece      | Version / choice                                                            |
| ---------- | --------------------------------------------------------------------------- |
| React      | 19.3 with StrictMode enabled                                                |
| Bundler    | Vite (`vp dev` / `vp build`) + `@vitejs/plugin-react`                       |
| CSS        | Tailwind v4 via `@tailwindcss/vite`, entry `src/styles.css`                 |
| Components | shadcn, `base` primitives (`@base-ui/react`), `nova` preset, `lucide` icons |

`components.json` records that configuration; `bunx --bun shadcn@latest add <component>` writes into `src/components/ui/`.

## Structure

- `src/app.tsx` — page shell, seeded document, `DocumentStats` (rendered only once the editor exists, so `useEditorState` subscribes to a live instance), and `<SlashMenu>`.
- `src/components/slash-menu.tsx` — the slash surface; the only place icons and markup for the menu are decided.
- `src/components/ui/` — shadcn output. Local modification: `popover.tsx` forwards an `anchor` prop to `Popover.Positioner`, required to anchor the menu at the caret instead of a trigger element.
- `src/styles.css` — preset theme tokens plus a `.slash-content` component layer that styles editor output with plain element selectors.

## Aliases

`vite.config.ts` maps `@slash-editor/core` and `@slash-editor/react` to package sources (HMR across the workspace) and `@` to `src`. `tsconfig.json` mirrors those paths.

## Running

```bash
vp run -F demo-react dev      # http://localhost:5173
vp run -F demo-react build
```
