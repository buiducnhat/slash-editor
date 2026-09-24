<p align="center">
  <img src=".github/assets/logo.png" alt="slash-editor" width="88" height="88">
</p>

# slash-editor

🏗️ **slash-editor** — Notion-style block editor for React.

A headless core on Tiptap/ProseMirror, React bindings, and shadcn/Tailwind UI you own.
MIT top to bottom — no paid tier, no hosted dependency.

[**slasheditor.dev**](https://slasheditor.dev) · [Documentation](https://slasheditor.dev/docs) · [Playground](https://slasheditor.dev/playground)
[![CI](https://github.com/buiducnhat/slash-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/buiducnhat/slash-editor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@slash-editor/core?label=%40slash-editor%2Fcore)](https://www.npmjs.com/package/@slash-editor/core)
[![npm version](https://img.shields.io/npm/v/@slash-editor/react?label=%40slash-editor%2Freact)](https://www.npmjs.com/package/@slash-editor/react)
[![License: MIT](https://img.shields.io/npm/l/@slash-editor/core)](#license)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-blue)](https://www.typescriptlang.org/)

## Workspace

| Path                               | Package               | Role                                                      |
| ---------------------------------- | --------------------- | --------------------------------------------------------- |
| [`packages/core`](packages/core)   | `@slash-editor/core`  | Extensions, schema, commands. No React, no CSS.           |
| [`packages/react`](packages/react) | `@slash-editor/react` | Hooks and headless primitives over `@tiptap/react`.       |
| [`site`](site)                     | —                     | Playground, docs, landing page, and shadcn registry host. |

## Status

M0–M7 complete — slash menu, block ids, drag handle, media/upload, mentions/AI, real-time
collaboration, distribution (npm packages, shadcn registry), and a single Fumadocs/Next.js app.
Full breakdown: [`docs/project-pdr/milestones.md`](docs/project-pdr/milestones.md).

## Quick start

```bash
bun add @slash-editor/core @slash-editor/react
```

`@tiptap/core`, `@tiptap/pm`, and `@tiptap/react` are peer dependencies.

```tsx
import { EditorContent, useSlashEditor, useSlashMenu } from "@slash-editor/react";

export function Editor() {
  const editor = useSlashEditor({
    content: "<p>Hello</p>",
    editorProps: { attributes: { class: "slash-content" } },
  });

  return (
    <>
      <EditorContent editor={editor} />
      {editor && <SlashMenu editor={editor} />}
    </>
  );
}
```

## UI components (shadcn registry)

The rendered UI (slash menu, bubble toolbar, node views, …) is a real shadcn registry.
Browse live examples and copy-paste install commands at
[**slasheditor.dev/docs**](https://slasheditor.dev/docs).
Add the registry once:

```json
{
  "registries": {
    "@slash-editor": "https://slasheditor.dev/r/{name}.json"
  }
}
```

Then install any component:

```bash
bunx --bun shadcn@latest add @slash-editor/slash-editor-kit
```

## Documentation

Visit the online documentation at [**slasheditor.dev/docs**](https://slasheditor.dev/docs), or browse [`docs/SUMMARY.md`](docs/SUMMARY.md) for architecture, codebase map, and code standards.

## Development

```bash
bun install          # install workspace dependencies
bun run dev          # playground + docs on http://localhost:3000
bun run test         # unit tests (Node, no DOM)
bun run test:e2e    # browser regression suite (Playwright)
bun run check       # format, lint, typecheck
bun run check --fix # auto-fix formatting/lint issues
bun run build       # build packages (core then react)
```

## Contributing

Please read the [contributing guide](CONTRIBUTING.md) before opening a PR.

## Community

- [GitHub Discussions](https://github.com/buiducnhat/slash-editor/discussions) — ideas, Q&A, showcase
- [GitHub Issues](https://github.com/buiducnhat/slash-editor/issues) — bugs and feature requests

## License

MIT — see [LICENSE](LICENSE). The full MIT dependency graph means you own every line of code
in your editor stack.
