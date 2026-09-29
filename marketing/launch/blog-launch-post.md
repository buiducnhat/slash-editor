---
title: "Why I built a fully MIT, Notion-style block editor for React"
description: "slash-editor: headless core on Tiptap v3, React hooks, and a shadcn registry for the UI. No paid tier."
canonical_url: https://slasheditor.dev/blog/launch
tags: react, opensource, tiptap, shadcn
cover_image: marketing/media/og-twitter.png
---

# Why I built a fully MIT, Notion-style block editor for React

**TL;DR** — [slash-editor](https://github.com/buiducnhat/slash-editor) is a Notion-style block
editor for React. Headless core on Tiptap v3/ProseMirror, React hooks, and UI delivered as a
real shadcn registry, so the menus, toolbars and node views land in _your_ repo as code you own.
MIT end to end, no paid tier, no hosted dependency.

- Playground: https://slasheditor.dev/playground
- Docs: https://slasheditor.dev/docs
- Starter: https://github.com/buiducnhat/slash-editor/tree/main/examples/nextjs-starter

![demo](https://raw.githubusercontent.com/buiducnhat/slash-editor/main/.github/assets/demo.gif)

## The gap

Every time I needed a "Notion-like" editor in a product, the engine was never the problem.
ProseMirror and Tiptap are excellent and MIT. Yjs and Hocuspocus make collaboration
self-hostable. The problem was the layer on top: the block interaction model.

Slash insertion, a hover drag handle, reordering nested blocks, "Turn into", block comments —
good options exist, but each came with a tradeoff for my use: styled npm components, a
different engine (Slate), or pieces like templates, AI or comments available on commercial
licenses or paid plans.

I wanted three things at once:

1. **Notion-grade block UX**, keyboard-first, with mouse equivalents.
2. **UI I own**, styled with my existing shadcn tokens, dark mode for free.
3. **A 100% MIT dependency graph**, with anything server-side (sync, AI, uploads) behind an
   adapter so I bring my own backend.

## The design: core computes, react coordinates, registry renders

```
@slash-editor/core    Tiptap/ProseMirror extensions, schema, commands. No React, no CSS.
@slash-editor/react   Hooks over @tiptap/react: lifecycle, store subscriptions, caret anchors.
shadcn registry       The rendered UI. `shadcn add` copies it into your app.
```

Core never emits a class name. Every UI surface (slash menu, bubble toolbar, drag handle, block
menu) is a small state machine in core exposed through a `subscribe`/`getState` store; React
hooks turn that into state plus an anchor rect; the registry component renders it with
`Popover`, `Command`, and your Tailwind tokens.

The result is a split I've wanted for years: **behavior ships over npm, so fixes reach you with
a version bump. Markup ships through the registry, so it's yours to change.**

```bash
bun add @slash-editor/core @slash-editor/react
bunx --bun shadcn@latest add @slash-editor/slash-editor-kit
```

## A few engineering details that were harder than they look

**Drag handle without `posAtCoords`.** The gutter and a block's left padding have no caret
position, so `view.posAtCoords` returns nothing exactly where the pointer is heading. Hover and
drop targets resolve from cached block rects instead (invalidated per transaction), picking the
smallest rect that contains the pointer so a list item wins over its list. Every move is a single
`delete + insert` transaction: one undo step, and the block's id rides along.

**Nesting rules from the schema, not a wrapper.** There's no universal `blockContainer` node.
Drops ask the schema: `canNest` checks `contentMatchAt(childCount)` (the state _after_ existing
children, since `listItem` is `paragraph block*`), and `canPlaceBeside` falls back to the
enclosing container instead of splitting a list. That keeps the document plain Tiptap JSON, so
third-party extensions and markdown serialization keep working.

**Yjs-safe from day one.** No non-deterministic attribute defaults; block ids assigned once on
insert, never on render, and regenerated only on pasted duplicates — skipped for remote
`y-sync` transactions. That's why collaboration, comments anchored to blocks, and Mermaid
diagrams (source is document text, so edits merge per character) all compose.

## What's in 0.5

- Slash menu with ranking, aliases, groups, custom items
- Drag handle with live preview card, block menu (duplicate, delete, turn into)
- Headings, lists, task lists, toggles, callouts, quotes, columns, tables
- Image / video / file / embed with an upload adapter
- Mentions, AI actions via a stream adapter (bring your own model)
- Real-time collaboration (Yjs, Hocuspocus or WebRTC), presence avatars, comments
- Mermaid diagrams, table of contents, read-only documents
- Markdown import/export and markdown shortcuts
- Docs with `llms.txt` / `llms-full.txt` so your coding agent can read them

## Non-goals

No hosted services — sync server, AI gateway and asset storage are adapters. No DOCX/PDF
fidelity, pagination or track changes. React only for now, though core stays renderer-free.

## Try it / help out

- ⭐ [Star the repo](https://github.com/buiducnhat/slash-editor) if it's useful
- Try the [playground](https://slasheditor.dev/playground) (add `?collab=room-name` and open it
  in two tabs)
- Pick a [good first issue](https://github.com/buiducnhat/slash-editor/labels/good%20first%20issue)
- Tell me what's missing in [Discussions](https://github.com/buiducnhat/slash-editor/discussions)

Feedback on the API shape is the most valuable thing right now, before 1.0 locks it in.
