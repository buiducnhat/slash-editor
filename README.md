# slash-editor

Notion-style block editor for React: headless core on Tiptap/ProseMirror, UI you own, shadcn + Tailwind native. MIT top to bottom — no paid tier, no hosted dependency.

## Workspace

| Path             | Package               | Role                                                         |
| ---------------- | --------------------- | ------------------------------------------------------------ |
| `packages/core`  | `@slash-editor/core`  | Extensions, schema, commands, serializers. No React, no CSS. |
| `packages/react` | `@slash-editor/react` | Hooks and headless primitives over `@tiptap/react`.          |
| `demo-react`     | —                     | Playground, docs target, and registry host.                  |

## Status

M0 (foundation) complete; M1 (block UX) in progress — the slash menu ships today, block ids, drag handle, nesting, and the bubble toolbar are outstanding. Full breakdown: [`docs/project-pdr/milestones.md`](docs/project-pdr/milestones.md).

## Documentation

Start at [`docs/SUMMARY.md`](docs/SUMMARY.md) — architecture, codebase map, code standards, and product docs.

## Development

```bash
vp install            # install workspace dependencies
vp run -F demo-react dev   # playground on http://localhost:5173
vp test               # unit tests (headless, no DOM)
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
          id: "callout",
          title: "Callout",
          group: "Basic blocks",
          aliases: ["note", "info"],
          run: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("callout").run(),
        },
      ],
    },
  },
});
```

## Demo stack

`demo-react` is initialized with shadcn **Base UI** (`--base base`) and the `nova` preset, so
registry components land in `src/components/ui` and inherit the project's tokens:

```bash
cd demo-react
bunx --bun shadcn@latest add <component>
```

`@slash-editor/core` and `@slash-editor/react` declare `@tiptap/core`, `@tiptap/pm`, and `@tiptap/react` as peer dependencies so a project never ends up with two ProseMirror instances.
