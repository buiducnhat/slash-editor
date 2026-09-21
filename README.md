# slash-editor

Notion-style block editor for React: headless core on Tiptap/ProseMirror, UI you own, shadcn + Tailwind native. MIT top to bottom — no paid tier, no hosted dependency.

## Workspace

| Path             | Package               | Role                                                         |
| ---------------- | --------------------- | ------------------------------------------------------------ |
| `packages/core`  | `@slash-editor/core`  | Extensions, schema, commands, serializers. No React, no CSS. |
| `packages/react` | `@slash-editor/react` | Hooks and headless primitives over `@tiptap/react`.          |
| `demo-react`     | —                     | Playground, docs target, and registry host.                  |

## Status

M0–M5 complete — slash menu, block ids, drag handle, media/upload, mentions/AI, real-time
collaboration, and distribution (npm packages, shadcn registry, docs site) all ship. Full
breakdown: [`docs/project-pdr/milestones.md`](docs/project-pdr/milestones.md).

## Installation

```bash
bun add @slash-editor/core @slash-editor/react
```

`@tiptap/core`, `@tiptap/pm`, and `@tiptap/react` are peer dependencies — install them in your
own app so you never end up with two ProseMirror instances.

### UI components (shadcn registry)

The rendered UI (slash menu, bubble toolbar, node views, …) is a real shadcn registry, built
from this repo's own source and hosted at **https://slash-editor-eta.vercel.app** — install any
piece on its own, or everything at once. Browse live examples and copy-paste commands at
[`/docs`](https://slash-editor-eta.vercel.app/docs).

Add the registry once, in your project's `components.json`:

```json
{
  "registries": {
    "@slash-editor": "https://slash-editor-eta.vercel.app/r/{name}.json"
  }
}
```

Then install everything:

```bash
bunx --bun shadcn@latest add @slash-editor/slash-editor-kit
```

…or a single piece, e.g. `bunx --bun shadcn@latest add @slash-editor/slash-menu`. Several
components depend on this repo's own anchor-aware `popover`/`dropdown-menu` overrides (also
served from the registry under the same namespace), not the stock shadcn versions — installing
by raw URL instead of the `@slash-editor/…` namespace will fail to resolve those.

## Documentation

Start at [`docs/SUMMARY.md`](docs/SUMMARY.md) — architecture, codebase map, code standards, and product docs.

## Development

```bash
vp install            # install workspace dependencies
vp run -F demo-react dev   # playground on http://localhost:5173
vp test               # unit tests (headless, no DOM)
vp run -F demo-react test:e2e   # browser regression suite (Playwright)
vp check              # format, lint, typecheck
vp run -F './packages/*' build
```

## Usage

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

`createBlockKit()` registers the slash menu by default. The core ranks items and owns the
keyboard state machine; `useSlashMenu(editor)` exposes that state plus a caret anchor, and the
UI layer renders it — see `demo-react/src/components/slash-menu.tsx` for a shadcn
`Command` + `Popover` implementation.

```tsx
const menu = useSlashMenu(editor);
// { open, query, items, activeIndex, activeItem, anchor, setActiveIndex, select, close }
```

Custom items are plain objects; `run` receives the editor and the range covering `/query`:

```tsx
useSlashEditor({
  blockKit: {
    slash: {
      items: [
        ...defaultSlashItems,
        {
          id: "date-stamp",
          title: "Date stamp",
          group: "Basic blocks",
          aliases: ["today", "date"],
          run: ({ editor, range }) =>
            editor.chain().focus().insertContentAt(range, new Date().toLocaleDateString()).run(),
        },
      ],
    },
  },
});
```

## Working on the demo app

`demo-react` (this repo's own playground/docs/registry host, not something you install) is
initialized with shadcn **Base UI** (`--base base`) and the `nova` preset. To add a _stock_
shadcn primitive to it (distinct from installing `@slash-editor` components into your own app —
see [Installation](#installation) above):

```bash
cd demo-react
bunx --bun shadcn@latest add <component>
```
