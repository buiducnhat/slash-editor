# Show HN

Post: Tue/Wed, 08:00–09:00 ET. URL field: https://github.com/buiducnhat/slash-editor (the repo
converts better than the landing page on HN). Stay in the thread 3–4 hours after posting.

## Title (≤80 chars, pick one)

1. `Show HN: Slash-editor – MIT Notion-style block editor for React, UI via shadcn`
2. `Show HN: A Notion-style block editor for React where you own the UI code`
3. `Show HN: Slash-editor – Headless Tiptap block editor with a shadcn registry`

## First comment (post immediately)

Hi HN, I'm Nhat. I built slash-editor because every time I needed a Notion-like editor, the
engine (ProseMirror/Tiptap) was never the problem. The block UX on top was: slash menu, hover
drag handle, reordering nested blocks, "turn into", block comments. The good options I found
either shipped as styled npm packages, ran on a different engine, or had some of those pieces
on commercial licenses or paid plans.

How it's split:

- `@slash-editor/core`: Tiptap v3 extensions, schema, commands, plus small state machines for
  each UI surface (slash menu, bubble toolbar, drag, block menu). No React, no CSS, no class
  names.
- `@slash-editor/react`: hooks that turn those stores into state plus an anchor rect.
- The UI is a real shadcn registry. `shadcn add @slash-editor/slash-editor-kit` copies the
  components into your repo, so you restyle them like any other shadcn component.

Behavior comes through npm (you get fixes with a version bump) and markup through the registry
(the code is yours to change).

Some things that took more work than I expected:

- The drag handle doesn't use `posAtCoords`. The gutter has no caret position, so hit-testing
  runs against cached block rects. Nesting and drop validity come from the schema's
  `contentMatchAt` and not from a wrapper node, so the doc stays plain Tiptap JSON.
- Everything is Yjs-safe: deterministic attrs, block ids assigned once at insert. Collab,
  block-anchored comments and Mermaid diagrams (source is doc text, so edits merge per
  character) all work together.

Also included: tables, columns, toggles, callouts, media with an upload adapter, mentions, AI
actions through a stream adapter (bring your own model), presence, table of contents,
read-only mode, markdown import/export.

Not included, on purpose: hosted anything. Sync, AI and storage are adapters. It's React-only
for now, though core has no renderer dependency.

Playground: https://slasheditor.dev/playground. Add `?collab=test` and open two tabs to
try the WebRTC collab.

It's 0.5, so I'd really value feedback on the API shape before 1.0.

## Prepared answers

- **"Why not just use Tiptap's UI components / Notion template?"** Those are good, and this
  builds on Tiptap. Tiptap's Notion-like template and Comments are on its paid plans; here the
  equivalents are MIT and delivered through a shadcn registry. Comparison:
  https://slasheditor.dev/docs/getting-started/comparison
- **"How is this different from BlockNote?"** BlockNote is also Tiptap v3-based, with its own
  block API and styled UI packages on npm (Mantine/shadcn/Ariakit). Its core is MPL-2.0 and
  collab/comments are free; AI, multi-column and exporters are `xl-*` packages under GPL-3.0 or
  a commercial license. slash-editor keeps plain Tiptap JSON and puts UI source in your repo.
- **"Plate?"** Plate is excellent, MIT, and also ships a shadcn registry. The main difference is
  the engine: Plate is Slate, slash-editor is ProseMirror/Tiptap. Pick by ecosystem.
- **"Vue/Svelte?"** Core has no React or DOM-styling dependency by design. Renderers for other
  frameworks are open for contributors.
- **"Bus factor / is this maintained?"** It's a solo project for now. Changelog and release
  cadence are public, CI runs unit and Playwright suites, and I'm looking for co-maintainers.
- **"Mobile?"** [Test on iOS/Android before launch and answer honestly.]
- **"Performance on large docs?"** [Measure a ~5k-block doc before launch and quote the numbers.]

## Don'ts

- Don't ask friends for upvotes. HN detects voting rings and will flag the post.
- Don't edit the title after posting.
- If the post doesn't take off, you may repost once after a few days with a different angle
  (the HN FAQ allows it).
