# X / Twitter

Media: `marketing/media/demo-30s-landscape.mp4` on tweet 1. Screenshots from
`marketing/media/ph-gallery-*.png` on tweets 3–5.
Post the same day as HN, around 1–2 hours later, and pin it.

## Launch thread

1/
I built a Notion-style block editor for React where you own the UI code.

Slash menu, drag handles, collab, comments, AI, Mermaid, tables, columns.

MIT end to end. No paid tier.

slasheditor.dev
🎥 [demo-30s-landscape.mp4]

2/
The split:

• @slash-editor/core: Tiptap v3 extensions + UI state machines. No React, no CSS
• @slash-editor/react: hooks
• UI: a real shadcn registry

Logic updates through npm. Markup is yours.

3/
Install:

bun add @slash-editor/core @slash-editor/react
bunx shadcn add @slash-editor/slash-editor-kit

The components land in your repo and use your Tailwind tokens. Dark mode just works.
🖼 [ph-gallery-4.png]

4/
Drag anything: list items, toggle children, task items. Drops check the schema, so you can't
build an invalid doc. Every move is one undo step.
🖼 [ph-gallery-2.png]

5/
Real-time collab with Yjs (Hocuspocus, y-websocket or WebRTC), presence, and comments anchored
to blocks. It's all self-hostable, and every backend piece is an adapter.
🖼 [ph-gallery-3.png]

6/
Try it: slasheditor.dev/playground
Starter + Deploy to Vercel: github.com/buiducnhat/slash-editor/tree/main/examples/nextjs-starter

A ⭐ helps a lot → github.com/buiducnhat/slash-editor

cc @shadcn @tiptap_editor

## Standalone posts (days after launch, one per day)

- "Type ` ```mermaid ` + space in slash-editor and you get a live diagram. It exports back to
  markdown fences, so it renders on GitHub." [clip of the mermaid part]
- "The docs ship /llms.txt and /llms-full.txt. Point Cursor/Claude at them and it can wire up
  slash-editor for you." [screenshot]
- "Adding a custom slash command is a plain object: id, title, aliases, run()." [code image made
  with ray.so]
- "Read-only mode keeps links and checkboxes interactive, and the gutter steps aside."
  [clip]

## Communities

Post the thread in the X Communities "shadcn/ui" and "React", then quote-tweet it from there.
