# Docs Site Design Brief

Accepted design for replacing the hand-rolled `/docs` routes with a real documentation site.
Status: implemented as M6 ([`milestones.md`](milestones.md)).

> **Amended by M7.** This brief's "Chosen approach" kept `demo-react` as a separate Vite app
> (playground + registry component source), aliased into `site` across a workspace boundary. M7
> later reversed that: `demo-react` was deleted, its registry source moved into `site/registry/`,
> and the playground rebuilt as a native `site` route. The "Why two bundlers" reasoning, the
> `demo-react/src/*` alias paths, and the prebuild playground-copy step described below are
> historical — see [`architecture/site-topology.md`](../architecture/site-topology.md) and the
> M7 entry in [`milestones.md`](milestones.md) for the current state.

## Foundation

### Problem

The documentation site is three TSX route files (`demo-react/src/routes/docs-app.tsx`,
`docs-overview.tsx`, `docs-item.tsx`) navigated by a ~40-line pushState router
(`src/lib/router.tsx`) and driven by `src/lib/registry-items.ts`, a hand-maintained array that
duplicates the titles and descriptions already in `registry.json`.

There is nowhere to put prose. Adding "Getting started" or "Writing a custom `UploadAdapter`"
means authoring a React component. There is no search, no API reference, no landing page — the
first impression of an MIT library competing against Tiptap's paid tiers is a flat list of
eight component links.

### Goals

- MDX prose authoring with live React demos embedded inline
- Sidebar and table of contents derived from the file tree, not a hardcoded array
- Full-text (Cmd-K) search
- Per-component preview/code tabs, with the code read from real source files
- Prop/type tables generated from `packages/core` and `packages/react` sources
- Dark mode, polished typography, mobile navigation
- A landing page

### Non-goals

- Versioned documentation (single version until 1.0)
- Internationalization
- Any change to `@slash-editor/core` or `@slash-editor/react`
- Rewriting the editor playground

### Chosen approach

A new `site/` workspace app — Next.js App Router with `fumadocs-ui` / `fumadocs-core` /
`fumadocs-mdx`, Tailwind v4, and the existing shadcn `base-nova` tokens — owns the domain.
`demo-react` keeps exactly two jobs: the editor playground, and being the source of truth for
registry component files.

Alternatives considered and rejected:

| Option                            | Rejected because                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Fumadocs on Vite + React Router 7 | One bundler, but thinner adapters (remark-only type tables, static-index search) and a peer-dep risk against the `vite-plus-core` override |
| Astro Starlight                   | Every live demo becomes a `client:only` React island; theming is not shadcn/Tailwind-token native                                          |
| Vite SPA + MDX libraries          | Hand-rolls sidebar, TOC, search indexing, and type tables — rebuilding Fumadocs, permanently maintained in-repo, with no SSG               |

Next.js was accepted despite being a second bundler because the cost is confined to one leaf
workspace that publishes no package, while all six required capabilities become library
features instead of project code.

### Routing map

| Path            | Owner                         | Notes                                                               |
| --------------- | ----------------------------- | ------------------------------------------------------------------- |
| `/`             | `site` (Next, static)         | Landing page                                                        |
| `/docs/**`      | `site` (Fumadocs + MDX)       | Prose, component docs, API reference                                |
| `/api/search`   | `site` (`createFromSource`)   | Fumadocs search endpoint                                            |
| `/playground`   | `demo-react` build, static    | Existing Vite SPA, `--base=/playground`, including `?collab=<room>` |
| `/r/:name.json` | `shadcn build` output, static | **Hard constraint:** published `components.json` files point here   |

## Technical Details

### Alias bridge

Registry components import `@/components/ui/*` and `@/lib/utils` internally. If `site` claimed
`@/*` for its own `src`, those transitive imports would resolve into the wrong tree.

`site` therefore inverts the convention:

- `@/*` → `../demo-react/src/*` (registry files work verbatim, zero edits)
- `~/*` → `./src/*` (the site's own modules)

Tailwind v4 scans per project root, so the site CSS must add `@source "../demo-react/src"` and
import the `.slash-content` layer from `demo-react/src/styles.css`.

This is what guarantees a rendered demo cannot drift from the installed component: the docs
import the same files `registry.json` ships.

### MDX component surface

- `<ComponentPreview name="slash-menu" />` — a React Server Component reads
  `demo-react/src/components/<name>.tsx` from disk at build time for the Code tab (shiki
  highlighting, copy button). The Preview tab renders the demo through
  `dynamic(..., { ssr: false })`; client-only is mandatory because ProseMirror constructs
  against a live DOM.
- `<InstallCommand item="slash-menu" />` — emits
  `bunx --bun shadcn@latest add @slash-editor/<item>`, with the `components.json` registry
  snippet shown as a prerequisite.
- `<AutoTypeTable path="../packages/react/src/index.ts" name="..." />` — `fumadocs-typescript`
  (ts-morph) generates prop tables from real exports, so a renamed field shows up as a docs diff.

### Information architecture

```
content/docs/
  index.mdx                     Introduction
  getting-started/
    installation.mdx            packages + peer deps
    quick-start.mdx             minimal editor
    registry.mdx                components.json registry setup
  guides/
    slash-items.mdx             custom slash items, ranking
    block-kit.mdx               createBlockKit options
    upload-adapter.mdx          UploadAdapter contract, retry
    mentions.mdx                async mention provider
    ai-stream-adapter.mdx       StreamAdapter contract
    collaboration.mdx           Yjs + Hocuspocus self-host recipe
    comments.mdx                CommentThreadStore
  components/*.mdx              one per registry item, plus the kit
  api/
    core.mdx                    @slash-editor/core exports
    react.mdx                   @slash-editor/react hooks
```

`registry-items.ts` is deleted; its copy moves into MDX frontmatter.

### Build and deployment

`site`'s `prebuild` script:

1. `shadcn build` in `demo-react`, copy `public/r/*.json` → `site/public/r/`
2. `vite build --base=/playground` in `demo-react`, copy `dist/**` → `site/public/playground/`

`next.config` rewrites `/playground` → `/playground/index.html`. The root `vercel.json` build
override is replaced by a Next.js Vercel project rooted at `site/`.

**Open item:** Vercel monorepo root-directory versus a root-level build command needs one
preview deploy to settle. `/r/slash-editor-kit.json` must be verified to return 200 on that
preview before production is repointed.

### Cutover

Deleted once the site ships:

- `demo-react/src/routes/` (all three files)
- `demo-react/src/lib/registry-items.ts`
- the docs branch of `App` in `demo-react/src/app.tsx`
- `demo-react/src/lib/router.tsx` — with `/docs` gone, `demo-react` served one route plus
  `?collab=<room>`, leaving the pushState router with no caller

`TopNav`'s docs link becomes an absolute `/docs`.

### Risks

| Risk                                                    | Mitigation                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Second bundler in a Vite+-standard repo                 | Confined to one non-published leaf workspace; `vp check` still covers it, `vp test` excludes it |
| Next 16 / React 19.3 / Tailwind v4 / Fumadocs alignment | Versions verified at install, not assumed; slice 1 proves the integration before content lands  |
| Breaking published registry consumers                   | `/r/:name.json` paths unchanged; preview-URL verification gates the production switch           |
| `shadcn build` output path is cwd-relative              | Prebuild copies explicitly rather than assuming a destination                                   |
| ProseMirror/Yjs under SSR                               | Every demo is `ssr: false`; the playground stays a separate client-only build                   |

## Delivery

Five slices, each verifiable in a browser on its own:

1. **Scaffold** — `site/` with Fumadocs, nova tokens, and the alias bridge; one MDX page
   rendering one live `SlashMenu` demo. Proves the hardest integration first.
2. **Component docs** — `ComponentPreview` and `InstallCommand` across all eight registry items
   plus the kit; delete `demo-react/src/routes/*`.
3. **Prose** — getting-started and guides; `api/*` backed by `AutoTypeTable`.
4. **Landing** — hero with a live mini editor, feature grid, install snippet.
5. **Deploy** — prebuild wiring, Vercel reconfiguration, preview verification of `/r/*.json`
   and `/playground`.

### Verification

- The existing Playwright suite is untouched: it runs `bun run dev` against the Vite app on
  `:5173`, which slices 1–4 do not move.
- Added: a composed-build smoke check asserting `/r/slash-editor-kit.json` and `/playground`
  respond from the `site` build output.
- Browser verification of each docs page and the landing page.
- `vp check --fix` before finishing any slice.

### Documentation to update on landing

`docs/SUMMARY.md`, `docs/codebase/demo-app.md` (loses the docs-host role), a new
`docs/architecture/site-topology.md`, README installation links, and an M6 entry in
`docs/project-pdr/milestones.md`.
