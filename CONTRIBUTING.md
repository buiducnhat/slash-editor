# Contributing

Thanks for your interest in contributing to slash-editor. Please take a moment to
review this document before submitting a pull request.

## About this repository

slash-editor is a Bun workspace monorepo:

- `packages/core` — Headless engine: ProseMirror/Tiptap extensions, schema, commands. No React, no CSS.
- `packages/react` — React bindings: provider, hooks, unstyled primitives.
- `site` — The one app: playground, Fumadocs/Next.js docs site, landing page, and the shadcn registry host.

## Development

```bash
# Install all workspace dependencies
bun install

# Playground + docs site + registry on http://localhost:3000
bun run dev

# Unit tests (Node, no DOM)
bun run test

# Browser regression suite
bun run test:e2e

# Format, lint, typecheck
bun run check
bun run check --fix   # auto-fix
```

See [`docs/code-standard/toolchain.md`](docs/code-standard/toolchain.md) for the full toolchain
reference: Bun 1.4.2, Vite+ (`vp`), TypeScript 7, Vitest, Playwright, oxfmt/oxlint.

## Repository structure

See [`docs/codebase/directory-structure.md`](docs/codebase/directory-structure.md) for the full
file map, entry points, and generated artifacts.

## Package API reference

See [`docs/codebase/package-apis.md`](docs/codebase/package-apis.md) for the complete exported
surface of `@slash-editor/core` and `@slash-editor/react`.

## Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, build, test, ci, chore
Scope: core, react, site, registry, docs, etc.
```

Examples:

- `feat(slash-menu): add keyboard navigation`
- `fix(core): prevent crash on empty block`
- `docs(site): update installation guide`
- `refactor(react): simplify useSlashMenu hook`

## Changesets

This monorepo uses [changesets](https://github.com/changesets/changesets) to track version bumps
and generate the changelog. Before opening a PR, add a changeset:

```bash
bunx changeset
```

Follow the prompts. The changeset file lands in `.changeset/` and will be included in the next
release.

**When to add a changeset:**

- Any user-facing change: new feature, changed API, bug fix worth mentioning.
- **No changeset needed** for: typo fixes, comment updates, internal refactors with no behavior
  change, CI/config updates, or changes that do not affect the published packages.

### Version bumps

| Type in changeset | When to use                                     |
| ----------------- | ----------------------------------------------- |
| `patch`           | Bug fixes, internal improvements                |
| `minor`           | New features, backward-compatible API additions |
| `major`           | Breaking API changes                            |

### Releasing

`@slash-editor/core` and `@slash-editor/react` release in lockstep from
`.github/workflows/release.yml`, which runs on every push to `main`:

1. While changesets are pending, the workflow opens or updates a **"chore(release): version
   packages"** PR. Its commit is `bun run version-packages`: `changeset version` bumps both
   packages and writes their changelogs, and the script syncs the root version, adds the root
   `CHANGELOG.md` section from the changesets, and refreshes `bun.lock`. Edit the root changelog
   wording in that PR if needed.
2. Merging the PR is the release. The workflow sees a version npm does not have yet, builds,
   checks, tests and packs it, then waits for approval on the `npm-release` environment.
3. Once approved, it publishes both tarballs to npm through Trusted Publishing (no npm token),
   tags `vX.Y.Z` and creates the GitHub Release from the root changelog section.

A failed publish is retried by re-running the failed job; packages already on npm are skipped.
Never bump versions or push release tags by hand.

## Testing

### Unit tests

Unit tests for `@slash-editor/core` live in `packages/core/tests/`, one file per source module:

```
packages/core/src/slash-items.ts
packages/core/tests/slash-items.test.ts
```

Run: `bun run test`

### E2E tests

Browser regression tests live in `site/tests/e2e/`. Run against `site`'s dev server:

```bash
bun run dev   # terminal 1
bun run test:e2e   # terminal 2
```

See [`docs/code-standard/testing-and-verification.md`](docs/code-standard/testing-and-verification.md)
for what earns a test and how to run browser verification via Orca CLI.

## Pull request checklist

Before requesting review:

- [ ] Branch off `main` — target `main` for all changes
- [ ] `bun run check --fix` passes (format, lint, typecheck)
- [ ] `bun run test` passes (unit tests)
- [ ] `bun run test:e2e` passes (e2e tests) if you changed editor behavior
- [ ] A changeset is added in `.changeset/` describing the change
- [ ] README or docs updated if behavior or API changed
- [ ] PR title follows the commit convention

## PR titles

Use the same `type(scope): description` format as commit messages. This is enforced by the
maintainer at merge time.

## One PR per concern

If you want to do more than one thing, send multiple pull requests. This makes review faster and
easier to revert if needed.

## Etiquette

Please be considerate toward maintainers. Open-source work takes time and care. Let's keep the
community welcoming and professional.

## Getting help

If you're stuck, open a discussion on GitHub or reach out. We're happy to help.
