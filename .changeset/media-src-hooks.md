---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Media upload result mapping and display URLs (`@slash-editor/core`, `@slash-editor/react`):

- **`toAttrs` option on `image`, `file`, and `video`.** Maps the adapter's full upload result onto node attrs (default `{ src: result.url }`) on the first success and on every retry, merged over the existing attrs — persist a server's canonical name/size/mime or id without reimplementing `retryImage`/`retryFile`/`retryVideo`. Also reachable through `createBlockKit({ image | file | video: { toAttrs } })`.
- **Display-only `resolveSrc` option on `image`, `file`, `video`, and `embed`** (`embed` receives its stored `url`). Rewrites the URL a node view displays — signed URLs, files behind auth — while `getHTML()`, markdown, and JSON keep the canonical stored value. New `ResolveSrc` and `UploadToAttrs` types.
- **`useResolvedSrc(src, node, resolveSrc)`** hook: sync results on the same render, async results once settled (stale results for a changed `src` are discarded), errors fall back to the stored URL. The registry `node-views` image/file/video/embed views apply it.
