# Reddit

Rules: write a different post for each subreddit and space them out (at most 1–2 per day). Read
each sub's self-promo rules before posting. Answer every comment in the first 2 hours. Attach
`marketing/media/demo-short.gif` or `demo-60s-landscape.mp4` as native media and put the links
in the body. Native media gets more reach than a link post.

---

## r/reactjs

Self-promo is allowed only in the weekly "Share your project" thread or on the flair-specific
days. Check the sidebar first.

**Title:** I built an MIT Notion-style block editor for React. Headless core, and the UI is a
shadcn registry you own

**Body:**

I've needed a Notion-like editor in a few products, and I kept running into the same issue:
Tiptap/ProseMirror are great, but the block UX on top (slash menu, drag handle, nested reorder,
turn-into, comments) often meant styled npm components or pieces on paid plans.

slash-editor splits it into:

- `@slash-editor/core`: Tiptap v3 extensions plus framework-agnostic state machines for each UI
  surface
- `@slash-editor/react`: hooks (`useSlashEditor`, `useSlashMenu`, `useBlockDrag`, …)
- UI through a shadcn registry: `shadcn add @slash-editor/slash-editor-kit`

It covers collab (Yjs), comments, mentions, AI through a stream adapter, tables, columns,
Mermaid, TOC, read-only mode and markdown import/export. It's all MIT.

- Playground: https://slasheditor.dev/playground
- Repo: https://github.com/buiducnhat/slash-editor

Two questions for the sub. Is the hook API shape reasonable? And what would you need before
you'd use this in production?

---

## r/nextjs

**Title:** Notion-style editor starter for Next.js App Router (MIT, shadcn, one-click Vercel
deploy)

**Body:**

I put together a Next.js starter for slash-editor, a block editor I've been building on
Tiptap v3. The UI components come in through the shadcn registry, so they sit in your
`components/` like the rest of your shadcn UI.

- Deploy: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbuiducnhat%2Fslash-editor%2Ftree%2Fmain%2Fexamples%2Fnextjs-starter&project-name=slash-editor-starter&repository-name=slash-editor-starter
- Starter: https://github.com/buiducnhat/slash-editor/tree/main/examples/nextjs-starter
- Docs: https://slasheditor.dev/docs

It's SSR-safe (`immediatelyRender: false`), and the docs site itself runs on Next 16 +
Fumadocs. I'd like to hear about any App Router edge cases you hit.

---

## r/webdev (Showoff Saturday only)

**Title:** [Showoff Saturday] An open-source Notion-style editor with drag-to-reorder,
real-time collab and Mermaid diagrams

**Body:** Short version: 3 bullets plus the links. The GIF carries this post.

---

## r/opensource

**Title:** slash-editor: an MIT Notion-style block editor for React with no paid tier and no
hosted dependency

**Body:** Lead with the licensing angle: a 100% MIT dependency graph, every backend piece is an
adapter, and it's self-hostable collab. Then link to CONTRIBUTING.md and the good-first-issues.

---

## r/tiptap (small, low risk)

**Title:** Open-source block UX layer for Tiptap v3: slash menu, drag handle, block menu, shadcn
UI

**Body:** Technical. Explain how the drag uses rect hit-testing and `contentMatchAt` for nesting,
and that the doc stays plain Tiptap JSON, so any Tiptap extension works with it.

---

## r/SideProject, r/javascript

Wait until at least a week after the posts above, and link the blog post.
