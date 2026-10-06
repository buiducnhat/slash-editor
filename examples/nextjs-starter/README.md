# slash-editor Next.js starter

A complete Next.js (App Router, TypeScript, Tailwind CSS v4, shadcn) starter for
[slash-editor](https://slasheditor.dev): nine working demo pages that cover every feature, each
backed by route handlers and adapters you can swap for your own backend.

It uses the published `@slash-editor/core` and `@slash-editor/react` packages. The UI in
`components/` was installed from the slash-editor shadcn registry, so it's plain source code
you can edit however you like.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbuiducnhat%2Fslash-editor%2Ftree%2Fmain%2Fexamples%2Fnextjs-starter&project-name=slash-editor-starter&repository-name=slash-editor-starter)

## Get started

```bash
npx degit buiducnhat/slash-editor/examples/nextjs-starter my-editor
cd my-editor
npm install
npm run dev
```

Or with `create-next-app`:

```bash
bunx create-next-app --example https://github.com/buiducnhat/slash-editor/tree/main/examples/nextjs-starter my-editor
```

Open http://localhost:3000 and pick a demo.

## Demos

| Route | Shows |
| --- | --- |
| `/editor` | Every block and surface in one document: slash menu, drag handle, bubble toolbar, mentions, emoji, comments, outline. Autosaves to `localStorage`. |
| `/notes` | Notion-style pages: sub-pages, page links, breadcrumbs, icons, covers, backlinks over a `PageStore`. |
| `/collab` | Yjs collaboration with live carets and presence avatars. Open a room in two tabs. |
| `/ai` | Slash, selection and block AI actions streamed from `app/api/ai/route.ts`. |
| `/markdown` | Two-way markdown editing, `.md` import and export. |
| `/media` | Image, file, video and embed blocks uploaded through `app/api/upload`. |
| `/i18n` | The `messages` option: English, Tiếng Việt, Français, 日本語, Español. |
| `/read-only` | A published article rendered with `editable: false` and an outline. |
| `/custom` | Your own Tiptap node, React node view, slash items and toolbar action. |

## What's inside

| Path | Purpose |
| --- | --- |
| `app/<demo>/page.tsx` | One route per demo; each renders a client component from `components/` |
| `app/api/{ai,upload,mentions}` | Route handlers behind the AI, upload and `@`-mention adapters |
| `lib/editor-kit.ts` | `BLOCK_KIT`: the shared `blockKit` options every demo spreads and extends |
| `components/editor-surface.tsx` | The editor card with its floating menus, plus the outline and comments rail |
| `components/*`, `components/ui/*` | UI installed from the `@slash-editor` shadcn registry |
| `lib/*-adapter.ts`, `lib/mention-provider.ts` | Browser side of the route handlers |
| `lib/comment-store.ts`, `lib/page-store.ts` | `localStorage`-backed comment and page stores |
| `app/globals.css`, `app/slash-content.css` | Design tokens and `.slash-content` editor styles |

## Make it yours

Each integration point has one file to replace:

- **Uploads**: `app/api/upload/route.ts` writes to the OS temp directory, which is ephemeral. Send the file to S3, R2 or Vercel Blob instead and return its public URL. The browser side is `lib/upload-adapter.ts`.
- **AI**: `generate()` in `app/api/ai/route.ts` returns canned text. Call your model there and yield each delta; `lib/stream-adapter.ts` already streams the response into the editor.
- **Mentions**: `lib/directory.ts` backs `app/api/mentions/route.ts`. Query your user table instead.
- **Comments**: back `CommentThreadStore` (`lib/comment-store.ts`) with your database.
- **Pages**: back `PageStore` (`lib/page-store.ts`) with your API, and save each page body on `onUpdate`.
- **Collaboration**: `/collab` uses `y-webrtc`. For a hosted room set `NEXT_PUBLIC_WEBRTC_SIGNALING_URL` (see `.env.example`), or swap in a Hocuspocus or `y-websocket` provider in `lib/collaboration.ts`.

The registry is already configured in `components.json`, so you can add or update pieces
with shadcn:

```bash
npx shadcn@latest add @slash-editor/slash-editor-kit
```

See the [docs](https://slasheditor.dev/docs) for every option, or try the
[playground](https://slasheditor.dev/playground).

## License

MIT
