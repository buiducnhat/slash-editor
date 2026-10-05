# Documentation Summary

**slash-editor** — a Notion-style block editor for React: a headless core on Tiptap/ProseMirror, React bindings, and shadcn-native UI you own. MIT end to end, no paid tier and no hosted dependency.

Bun workspace: `@slash-editor/core` (engine, no React/CSS) → `@slash-editor/react` (hooks) → `site` (the one app: playground, Fumadocs/Next.js docs site, landing page, and the shadcn registry host). Toolchain is Vite+ (`vp`) with TypeScript 7, Vitest, and Playwright for browser regression coverage against `site`; `site` itself builds with Next.js.

**Status:** M0–M11 complete (v0.7.0 on npm). Block editing, slash menu, drag/nest, callout/toggle/task-list nodes, bubble toolbar, image/file/video/embed with a pluggable `UploadAdapter` (upload/retry, `toAttrs` result mapping, display-only `resolveSrc`), tables, columns, `@`-mentions with an async provider, emoji picker and syntax-highlighted code blocks (opt-in via the `@slash-editor/core/emoji` and `@slash-editor/core/code-block` subpaths), inline link editing, AI actions (slash, selection, block) over a `StreamAdapter`, real-time collaboration (Yjs + Hocuspocus self-host recipe, presence carets, comment mark + thread store), table of contents and read-only documents, localization through the `messages` option, markdown import/export (`@slash-editor/core/markdown`), Mermaid diagram blocks, Notion-style pages (host-owned `PageStore`, `subPage`/`pageLink` nodes, tree/breadcrumb/backlinks), a Playwright regression suite, distribution (`@slash-editor/core`/`react` on npm via a Changesets-driven, environment-gated OIDC release pipeline, plus a shadcn registry), and a single Fumadocs/Next.js app — docs site, landing page, and playground — deployed at [slasheditor.dev](https://slasheditor.dev). See [`project-pdr/milestones.md`](project-pdr/milestones.md).

## Agent Context Guide

Before planning or implementing, read this `docs/SUMMARY.md` file first. Load only the detail docs relevant to the current task, and prioritize `Code Standard` docs for implementation conventions. If docs conflict with code or user intent, use the available question tool before making broad changes.

## Architecture

System design, component interactions, data flows, deployment, and external integrations.

| File                                                                     | Description                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [architecture/package-topology.md](architecture/package-topology.md)     | Workspace layering, layer contract, peer-dependency rules, build graph                  |
| [architecture/editor-runtime.md](architecture/editor-runtime.md)         | How an editor instance is composed, document model, schema and lifecycle decisions      |
| [architecture/slash-command-flow.md](architecture/slash-command-flow.md) | Slash menu data flow, keyboard ownership, ranking, per-editor storage, failure handling |
| [architecture/site-topology.md](architecture/site-topology.md)           | docs/landing/playground/registry routing split, alias bridge, build and deploy          |

## Codebase

Directory structure, entry points, API patterns, and key modules.

| File                                                               | Description                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [codebase/directory-structure.md](codebase/directory-structure.md) | File map, entry points, generated artifacts                                            |
| [codebase/package-apis.md](codebase/package-apis.md)               | Complete exported surface of `core` and `react`, plus the registry reference component |

## Code Standard

Conventions, naming rules, tech stack versions, and development workflows.

| File                                                                                   | Description                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [code-standard/toolchain.md](code-standard/toolchain.md)                               | Tool versions, commands, tsconfig layout, dependency policy, git hooks  |
| [code-standard/typescript-conventions.md](code-standard/typescript-conventions.md)     | Module style, naming, comments, Tiptap-specific extension rules         |
| [code-standard/ui-conventions.md](code-standard/ui-conventions.md)                     | shadcn Base UI usage, styling rules, composition, editor UI constraints |
| [code-standard/testing-and-verification.md](code-standard/testing-and-verification.md) | What earns a test, current suites, browser verification via Orca CLI    |

## Project PDR

Product goals, use cases, business rules, and constraints.

| File                                                                                           | Description                                                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [project-pdr/product-goals.md](project-pdr/product-goals.md)                                   | Problem framing, licensing landscape, goals, non-goals, users, constraints                              |
| [project-pdr/milestones.md](project-pdr/milestones.md)                                         | M0–M11 status with per-slice checkboxes, features shipped between milestones, deferred decisions        |
| [project-pdr/design-brief.md](project-pdr/design-brief.md)                                     | Accepted design brief: foundation, technical details, delivery plan, risks                              |
| [project-pdr/docs-site-design-brief.md](project-pdr/docs-site-design-brief.md)                 | Accepted design for the Fumadocs/Next.js docs site replacing the hand-rolled `/docs` routes             |
| [project-pdr/markdown-design-brief.md](project-pdr/markdown-design-brief.md)                   | Accepted design for markdown import/export: mapping, marker grammar, subpath entry                      |
| [project-pdr/mermaid-design-brief.md](project-pdr/mermaid-design-brief.md)                     | Accepted design for Mermaid diagram blocks: core node, click-to-edit NodeView, theming                  |
| [project-pdr/pages-design-brief.md](project-pdr/pages-design-brief.md)                         | Accepted design for Notion-style pages: `PageStore` adapter, sub-page/link nodes, tree, backlinks       |
| [project-pdr/table-of-contents-design-brief.md](project-pdr/table-of-contents-design-brief.md) | Accepted design for the table of contents and read-only documents: outline store, active heading, hooks |
| [project-pdr/ui-consistency-design-brief.md](project-pdr/ui-consistency-design-brief.md)       | Accepted design unifying slash/bubble/block menu, Ask AI, and comments on core registries               |
