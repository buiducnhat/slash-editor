# Package Topology

Bun workspace with two publishable packages and one private app.

```
@slash-editor/core   packages/core    engine: Tiptap/ProseMirror extensions, schema, item registry
        ▲
        │ workspace:*
@slash-editor/react  packages/react   React bindings: hooks over @tiptap/react
        ▲
        │ workspace:*
site                 site             app: shadcn Base UI components + Tailwind v4 — rendering, playground, docs
```

## Layer contract

| Layer   | Owns                                                                                      | Never contains               |
| ------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| `core`  | Node/mark schema, commands, slash registry, ranking, keyboard state machine               | React, JSX, CSS, class names |
| `react` | Editor lifecycle, store subscriptions, caret anchors                                      | Styling, markup decisions    |
| `site`  | Rendered surfaces (`Command`, `Popover`), icon mapping, Tailwind tokens, playground, docs | Editing logic                |

The rule that keeps the layers honest: **core computes, react coordinates, registry renders.** Core emits no class names; UI layers select on elements and `data-*` attributes.

## Dependency rules

- `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `react`, `react-dom` are **peer dependencies** of both packages. Two copies of `prosemirror-model`/`prosemirror-state` in one app produce schema mismatches that fail at runtime, so the host app owns those versions.
- `@tiptap/starter-kit` and `@tiptap/suggestion` are regular dependencies of `core`; both declare the ProseMirror packages as peers, so they deduplicate against the host.
- `@tiptap/markdown` and `marked` are regular dependencies of `core`, imported only by the `@slash-editor/core/markdown` subpath entry (`dist/markdown.mjs`; both entries share one chunk), so bundles that never import it stay free of them. `core`'s `build` script lists both entries; `vp pack` writes the `exports` map.
- `site` aliases `@slash-editor/*` to package **sources** via `next.config.mjs`'s `outputFileTracingRoot` and `tsconfig.json` path aliases (`@slash-editor/core`/`@slash-editor/react` → `../packages/*/src/index.ts`, `@slash-editor/core/markdown` → `../packages/core/src/markdown.ts`), so HMR covers the whole workspace during development.

## Build graph

`vp run -F './packages/*' build` builds `core` before `react` (workspace dependency order). `packages/react/tsconfig.json` resolves `@slash-editor/core` to `../core/dist/index.d.mts` rather than core's sources — resolving through the source alias makes the declaration generator emit stray `.d.ts` files next to `packages/core/src`. Consequence: **core must be built before `vp check` can type-check `react`**.
