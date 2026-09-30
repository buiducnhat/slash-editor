<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-white.png">
    <img src=".github/assets/logo.png" alt="slash-editor" width="88" height="88">
  </picture>
</p>

<h1 align="center">slash-editor</h1>

<p align="center">
  <strong>Notion-style block editor for React.</strong> MIT end to end, UI you own.
</p>

<p align="center">
  A headless core on Tiptap v3/ProseMirror, React hooks, and a shadcn registry that copies the
  rendered UI into your repo. No paid tier, no hosted dependency.
</p>

<p align="center">
  <a href="https://slasheditor.dev"><strong>slasheditor.dev</strong></a> ·
  <a href="https://slasheditor.dev/docs">Documentation</a> ·
  <a href="https://slasheditor.dev/playground">Playground</a>
</p>

<p align="center">
  <a href="https://github.com/buiducnhat/slash-editor/actions/workflows/ci.yml"><img src="https://github.com/buiducnhat/slash-editor/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@slash-editor/core"><img src="https://img.shields.io/npm/v/@slash-editor/core?label=%40slash-editor%2Fcore" alt="@slash-editor/core version"></a>
  <a href="https://www.npmjs.com/package/@slash-editor/react"><img src="https://img.shields.io/npm/v/@slash-editor/react?label=%40slash-editor%2Freact" alt="@slash-editor/react version"></a>
  <a href="#license"><img src="https://img.shields.io/npm/l/@slash-editor/core" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-7-blue" alt="TypeScript 7"></a>
</p>

<p align="center">
  <a href=".github/assets/demo.mp4">
    <img src=".github/assets/demo.gif" alt="slash-editor demo" width="100%">
  </a>
</p>

## Features

- **Block UX:** slash menu, drag handle with live preview, nested reorder, block menu (turn into, duplicate, delete)
- **Blocks:** headings, lists, task lists, toggles, callouts, quotes, columns, tables, Mermaid diagrams
- **Media:** image, video, file, embed, with an upload adapter for your own storage
- **Collaboration:** Yjs (Hocuspocus, y-websocket, or WebRTC), presence avatars, block-anchored comments
- **AI:** slash, selection, and block actions through a stream adapter (bring your own model)
- **Documents:** table of contents, read-only mode, markdown import/export and shortcuts
- **Ownership:** behavior updates via npm, markup lives in your repo via `shadcn add`

## Try it

- [Playground](https://slasheditor.dev/playground): add `?collab=<room>` and open it in two tabs.
- [Next.js starter](examples/nextjs-starter): clone it, or deploy your own copy in one click.

  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbuiducnhat%2Fslash-editor%2Ftree%2Fmain%2Fexamples%2Fnextjs-starter&project-name=slash-editor-starter&repository-name=slash-editor-starter"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="32"></a>

## How it compares

|                             | slash-editor    | Tiptap         | BlockNote       | Novel       | Plate           |
| --------------------------- | --------------- | -------------- | --------------- | ----------- | --------------- |
| Engine                      | Tiptap v3       | ProseMirror    | Tiptap v3       | Tiptap v2   | Slate           |
| Core license                | MIT             | MIT            | MPL-2.0         | Apache-2.0  | MIT             |
| Commercially licensed parts | None            | Platform plans | `xl-*` packages | None        | Plate Plus      |
| UI delivery                 | shadcn registry | CLI copy-in    | npm packages    | npm package | shadcn registry |
| Collab / comments           | ✅ / ✅         | ✅ / paid      | ✅ / ✅         | ❌ / ❌     | ✅ / ✅         |

Details, sources, and when another editor fits better: [slasheditor.dev/docs/getting-started/comparison](https://slasheditor.dev/docs/getting-started/comparison).

## Workspace

| Path                               | Package               | Role                                                      |
| ---------------------------------- | --------------------- | --------------------------------------------------------- |
| [`packages/core`](packages/core)   | `@slash-editor/core`  | Extensions, schema, commands. No React, no CSS.           |
| [`packages/react`](packages/react) | `@slash-editor/react` | Hooks and headless primitives over `@tiptap/react`.       |
| [`site`](site)                     | —                     | Playground, docs, landing page, and shadcn registry host. |
| [`examples`](examples)             | —                     | Standalone starters consuming the published packages.     |

## Quick start

```bash
bun add @slash-editor/core @slash-editor/react
```

`@tiptap/core`, `@tiptap/pm`, and `@tiptap/react` are peer dependencies.

```tsx
import { EditorContent, useSlashEditor } from "@slash-editor/react";
import { SlashMenu } from "@/components/slash-menu"; // from the registry, see below

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
