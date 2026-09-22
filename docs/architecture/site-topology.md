# Site Topology

How the playground, docs site, landing page, and shadcn registry fit together inside `site` — the
single Next.js app that owns every public surface. History: `/docs` started as hand-rolled routes
inside a separate `demo-react` Vite app ([`project-pdr/docs-site-design-brief.md`](../project-pdr/docs-site-design-brief.md)
covers that first move); `demo-react` was later folded into `site` entirely, including the
playground and the registry component source (M7, [`project-pdr/milestones.md`](../project-pdr/milestones.md)).

## Routing map

| Path             | Owner                              | Notes                                                              |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `/`              | `app/(home)/page.tsx`              | Landing page                                                       |
| `/playground`    | `app/(home)/playground/page.tsx`   | Live editor; `?collab=<room>` for real-time collaboration          |
| `/docs/**`       | `app/docs/**` (Fumadocs + MDX)     | Prose, component docs, API reference                               |
| `/docs/**.md`    | `app/llms.mdx/docs/**` (rewritten) | Same page as Markdown, for AI agents                               |
| `/llms.txt`      | `app/llms.txt/route.ts`            | Page index for LLMs, generated from the page tree                  |
| `/llms-full.txt` | `app/llms-full.txt/route.ts`       | Every docs page concatenated as Markdown                           |
| `/api/search`    | `app/api/search/route.ts`          | Fumadocs search endpoint                                           |
| `/r/:name.json`  | `shadcn build` output, static      | **Hard constraint** — published `components.json` files point here |

`/playground` and `/` share `app/(home)/layout.tsx` (`HomeLayout`), the same nav, search dialog,
and theme toggle as everywhere else — one app shell, not three separately-styled surfaces.

## The registry lives inside `site`

`site/registry/` is the shadcn registry component source: what `shadcn build` packages into
`/r/:name.json`, and what `shadcn add` installs into a consumer's app. `site/registry.json`
declares the items; `site/components.json` is the shadcn config (`style: base-nova`,
`css: app/globals.css`).

`site/tsconfig.json` gives `@/*` to `./registry/*`, so registry files' own internal imports
(`@/components/ui/popover`, `@/lib/utils`) resolve unchanged — the alias name matches shadcn's
own convention, just scoped to this one directory instead of an entire app.

## Live demos, the playground, and SSR

Every `ComponentPreview`'s Preview tab, the landing page's hero demo, and the playground itself
render a real `Editor` — which needs a live DOM. `@slash-editor/react` also touches DOM globals
(e.g. `DOMRect`) at module scope. All three mean these components cannot be server-rendered:

- `components/demo/registry-demos.tsx` / `components/playground/playground-editor.tsx` — the
  implementations, `"use client"`.
- `components/demo/registry-demos.preview.tsx` / `components/playground/playground-editor.preview.tsx`
  — one `next/dynamic(..., { ssr: false })` per component. `ssr: false` is only valid from a
  Client Component boundary, so these files exist purely to hold that boundary; MDX, the landing
  page, and `app/(home)/playground/page.tsx` import from here, never from the implementation
  files directly.

## Content generation

`site/source.config.ts` defines the `docs` collection with the **Config API**
(`defineDocs` from `fumadocs-mdx/config`), not the Macro API. The Macro API's `defineDocs()` only
gets its typed rewrite inside the live webpack/Turbopack bundle graph; the Config API persists
generated types to `.source/` on disk, which is what lets `site/lib/source.ts` and
`tsc --noEmit` see a real `PageData` shape (`body`, `toc`, `full`, …) outside a running
`next dev`/`next build` — the same "build artifacts before typecheck" shape `packages/react`
already requires of `packages/core`.

`components/registry/component-preview.tsx` and `components/registry/install-command.tsx` read
`site/registry.json` directly (`import registryData from "../../registry.json"`) rather than
maintaining a separate docs-facing copy — one manifest drives both `shadcn build` and the docs
site.

`components/mdx.tsx` wires `fumadocs-typescript`'s `AutoTypeTable` against a
`createFileSystemGeneratorCache`-backed generator, so `<AutoTypeTable path="../packages/core/src/upload.ts" name="UploadAdapter" />`
in a guide or API page reads real `packages/*/src` exports via ts-morph.

## Docs for LLMs

`source.config.ts`'s `docs.postprocess.includeProcessedMarkdown: true` makes `fumadocs-mdx`
export each page's postprocessed Markdown (`page.data.getText('processed')`), not just the
compiled MDX component — fumadocs-core's `llms()` (`lib/source.ts`'s `docsLlms`) renders that
into three surfaces: `app/llms.txt/route.ts` (a page-tree index, one line per page with its
description), `app/llms-full.txt/route.ts` (every page concatenated), and
`app/llms.mdx/docs/[[...slug]]/route.ts` (one page at a time) reachable at `/docs/**.md` via
`next.config.mjs`'s rewrite. JSX component syntax (e.g. `<SlashMenuDemo />`) appears verbatim in
the Markdown output rather than being rendered or stripped — the default `llms()` behavior, left
as-is since the JSX itself is usually still legible context for an agent reading the page.

Every docs page surfaces this itself: `app/docs/[[...slug]]/page.tsx` renders fumadocs-ui's
`MarkdownCopyButton`/`ViewOptionsPopover` above `DocsBody`, pointed at the per-page route via
`lib/shared.ts`'s `getPageMarkdownUrl` — "Copy Markdown", "View as Markdown", "Open in
ChatGPT/Claude/Cursor", and a GitHub source link, all without a person needing to know `/llms.txt`
exists. The top nav's GitHub link is `baseOptions()`'s `githubUrl` shorthand rather than a
`links` entry — fumadocs-ui renders that as the icon-only button next to the theme toggle
(sidebar footer in `DocsLayout`, top-right in `HomeLayout`), not further nav-list text.

## Build and deploy

`site/scripts/prebuild.ts` (invoked by the `build:prepare` script, which `build` runs before
`next build`) runs `bunx --bun shadcn build` from `site/`, producing `public/r/*.json` directly —
no cross-workspace copy step, since the registry source already lives in `site`. The playground
needs no prebuild step at all: it's a native route, prerendered/served like any other page.

**Required manual step:** the linked Vercel project's **Root Directory** must be set to `site`
(Settings → General → Root Directory) for Next.js zero-config framework detection — this
determines the serverless/SSG output shape and cannot be expressed in `vercel.json`. Vercel's
monorepo-aware install still runs from the repo root (detects the root `bun.lock`), so every
workspace's dependencies remain installed regardless of Root Directory. Once set,
`site/package.json`'s own `build` script (`bun run build:prepare && next build`) runs
zero-config — no `vercel.json` override is needed.

## One app, one bundler

`demo-react` no longer exists. Before M7, the playground was a separate Vite SPA, pre-built and
copied into `site/public/playground/` with a URL rewrite; the registry component source lived in
a second workspace `site` aliased into. Both seams are gone: the playground is a native Next.js
route sharing every other page's layout, data fetching, and build pipeline, and the registry
source lives inside `site/registry/` directly. One `bun run dev`, one `next build`, one
Playwright suite (`site/tests/e2e`, `site/playwright.config.ts`) covering insert/reorder/nest,
paste normalization, upload/AI retry, and real-time collaboration against the same app.
