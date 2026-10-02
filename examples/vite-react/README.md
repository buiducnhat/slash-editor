# slash-editor Vite + React starter

A minimal Vite + React (TypeScript, Tailwind CSS v4, shadcn) app with a complete
[slash-editor](https://slasheditor.dev) setup: slash menu, bubble toolbar, drag handle, mentions,
link editor, comments, table of contents, and media/AI/Mermaid node views.

It uses the published `@slash-editor/core` and `@slash-editor/react` packages. The UI in
`src/components/` was installed from the slash-editor shadcn registry, so it's plain source code
you can edit however you like.

## Get started

```bash
npx degit buiducnhat/slash-editor/examples/vite-react my-editor
cd my-editor
npm install
npm run dev
```

Open http://localhost:5173 and type `/` on an empty line.

## What's inside

| Path                             | Purpose                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/components/editor.tsx`      | The editor: `useSlashEditor` options, sample content, and every kit surface                         |
| `src/components/*`, `src/components/ui/*` | UI installed from the `@slash-editor` shadcn registry                                               |
| `src/lib/*-adapter.ts`, `src/lib/mention-provider.ts`, `src/lib/comment-store.ts` | In-memory mocks for uploads, AI streaming, mentions, and comments                                   |
| `src/globals.css`, `src/slash-content.css` | Design tokens and `.slash-content` editor styles                                           |

## Make it yours

The mocks in `src/lib/` are there for the demo. Swap them for real implementations:

- **Uploads**: implement `UploadAdapter` (`upload(file, { signal }) => { url }`) and pass it to the node views in `src/lib/node-view-extensions.tsx`.
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
