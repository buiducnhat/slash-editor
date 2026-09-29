# Draft issues

Create these with `marketing/github/setup.sh` (it reads this file), or paste them by hand.
Each `## ` heading is an issue title, and the line `labels:` sets its labels.

## Add a `highlight` mark with shadcn color swatches to the bubble toolbar

labels: good first issue, enhancement

Tiptap ships `@tiptap/extension-highlight` (MIT). Register it in `createBlockKit` behind a
`highlight` option (default on, `false` to opt out), and add a swatch dropdown to
`site/registry/components/bubble-toolbar`. Colors must come from CSS variables, not hex values.

- [ ] core option plus a unit test for opt-out
- [ ] toolbar dropdown
- [ ] docs: `site/content/docs/components/bubble-toolbar.mdx`

## Add an `/emoji` slash item and a `:shortcode:` emoji picker

labels: help wanted, enhancement

Use `@tiptap/extension-emoji` (MIT). Add it as a slash item and a suggestion menu that reuses
the `mention-menu` rendering pattern.

## Add a math block (KaTeX) using the same node view pattern as Mermaid

labels: help wanted, enhancement

Model it on `packages/core/src/mermaid.ts` and `mermaid-node-view`: keep the source as document
text (collab-safe), render lazily, and round-trip markdown with `$$` fences.

## Syntax highlighting for code blocks (lowlight)

labels: good first issue, enhancement

Swap StarterKit's `codeBlock` for `@tiptap/extension-code-block-lowlight` behind an option.
Theme the tokens with shadcn variables. Add a language selector to the node view.

## i18n: make slash item titles and UI strings overridable

labels: help wanted, enhancement

Add a `labels`/`messages` option so non-English apps can translate slash items, placeholder
text, and block menu actions. Include a Vietnamese example in the docs.

## Docs: "Persisting content" guide (JSON, markdown, database)

labels: good first issue, documentation

Show `editor.getJSON()`/`setContent`, debounce saving, and markdown export through
`@slash-editor/core/markdown`. Include a Next.js server action example.

## Docs: Vite + React example

labels: good first issue, documentation

Add `examples/vite-react` that mirrors `examples/nextjs-starter`.

## Playground: "Copy as markdown" / "Copy JSON" buttons

labels: good first issue, enhancement

Add both buttons to the playground header, using the existing markdown serializer.

## Accessibility audit: slash menu and block handle with VoiceOver/NVDA

labels: help wanted, accessibility

Walk through insertion, reordering (`Alt-Shift-ArrowUp/Down`), and the block menu with a
screen reader. Report missing roles and live-region announcements.

## Benchmark: typing latency and drag on a 5,000-block document

labels: help wanted, performance

Add a playground fixture and a Playwright perf script. Record the numbers in
`docs/code-standard/testing-and-verification.md`.

## Vue renderer spike (`@slash-editor/vue`)

labels: help wanted, discussion

Core has no renderer dependency. This spike checks whether the stores map cleanly to Vue
composables and should report which APIs leak React assumptions.
