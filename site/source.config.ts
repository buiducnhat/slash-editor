import { defineDocs } from "fumadocs-mdx/config";

/**
 * Config API, not the Macro API: this file is the single place the `docs`
 * collection is declared, and `fumadocs-mdx`'s CLI persists its generated
 * types to `.source/` on disk. That's what lets `lib/source.ts` and
 * `tsc --noEmit` see a real `PageData` shape (`body`, `toc`, `full`, …)
 * outside a live `next dev`/`next build` process — the Macro API's
 * `defineDocs()` only gets its typed rewrite inside the bundler graph.
 */
export const docs = defineDocs({
  dir: "content/docs",
});
