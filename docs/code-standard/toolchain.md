# Toolchain and Workflows

| Tool                            | Version              | Role                                                             |
| ------------------------------- | -------------------- | ---------------------------------------------------------------- |
| Bun                             | 1.4.2 (`devEngines`) | Package manager, isolated linker (per-package `node_modules`)    |
| Vite+ (`vp`)                    | 0.2.x                | Task runner, dev server, bundler, formatter, linter, test runner |
| TypeScript                      | 7.0.x (`tsgo`)       | Type checking and declaration emit                               |
| Vitest (via `vp test`)          | 4.x                  | Unit tests, Node environment                                     |
| oxfmt / oxlint (via `vp check`) | bundled              | Formatting and linting, type-aware                               |

## Commands

```bash
vp install                        # workspace install
vp run -F demo-react dev          # playground
vp run -F './packages/*' build    # build core then react (dependency order)
vp test                           # all workspace tests
vp check          # format + lint + typecheck (read-only)
vp check --fix    # same, writing formatting fixes
```

Always run `vp check --fix` before finishing a change; never hand-format.

## tsconfig layout

- Root `tsconfig.json` is the shared base: `strict`, `verbatimModuleSyntax`, `isolatedModules`, `noEmit`, `moduleResolution: bundler`, plus workspace path aliases for editor tooling.
- Each package's `tsconfig.json` sets `include: ["src"]` only. **Do not add `tests` to a package's build tsconfig** — it widens the declaration generator's `rootDir` and leaks `.d.ts` files next to sources. Tests get their own config (`packages/core/tests/tsconfig.json`).
- `packages/react/tsconfig.json` resolves `@slash-editor/core` to `../core/dist/index.d.mts`, so **core must be built before checking or building react**.

If `.d.ts` files ever appear beside `packages/*/src/*.ts`, delete them and find the build that resolved a workspace package through its source alias.

## Dependency policy

- Anything the host app must own (`react`, `react-dom`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`) is a peer dependency plus a dev dependency for local builds.
- Keep the dependency graph MIT. Paid or source-available tiers (Tiptap Cloud, hosted comments/AI) are out of scope by design.
- Add app-level packages with the project package manager: `bun add <pkg>` inside the target workspace, or `bunx --bun shadcn@latest add <component>` for UI.

## Git hooks

`vp config` (run via `prepare`) installs the hook dispatcher in `.vite-hooks/`; staged files run `vp check --fix` per the root `vite.config.ts` `staged` map.
