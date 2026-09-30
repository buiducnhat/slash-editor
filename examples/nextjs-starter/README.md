# slash-editor Next.js starter

A minimal Next.js (App Router, TypeScript, Tailwind CSS v4, shadcn) app with a complete
[slash-editor](https://slasheditor.dev) setup: slash menu, bubble toolbar, drag handle, mentions,
link editor, comments, table of contents, and media/AI/Mermaid node views.

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

Open http://localhost:3000 and type `/` on an empty line.

## What's inside

| Path                             | Purpose                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `components/editor.tsx`          | The editor: `useSlashEditor` options, sample content, and every kit surface                         |
| `components/*`, `components/ui/*` | UI installed from the `@slash-editor` shadcn registry                                               |
| `lib/*-adapter.ts`, `lib/mention-provider.ts`, `lib/comment-store.ts` | In-memory mocks for uploads, AI streaming, mentions, and comments                                   |
| `app/globals.css`, `app/slash-content.css` | Design tokens and `.slash-content` editor styles                                           |

## Make it yours

The mocks in `lib/` are there for the demo. Swap them for real implementations:

- **Uploads**: implement `UploadAdapter` (`upload(file, { signal }) => { url }`) and pass it to the node views in `lib/node-view-extensions.tsx`.
- **AI**: implement `StreamAdapter` (an async iterable of text chunks) in place of `mockStreamAdapter`.
- **Mentions**: point `blockKit.mention.items` at your user-search endpoint.
- **Comments**: back `CommentThreadStore` with your database.

The registry is already configured in `components.json`, so you can add or update pieces
with shadcn:

```bash
npx shadcn@latest add @slash-editor/slash-editor-kit
```

See the [docs](https://slasheditor.dev/docs) for every option, or try the
[playground](https://slasheditor.dev/playground).

## License

MIT
