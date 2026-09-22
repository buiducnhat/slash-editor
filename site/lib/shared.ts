import { createGetUrl } from "fumadocs-core/source";

/** Internal route `app/llms.mdx/docs/[[...slug]]/route.ts` serves per-page Markdown from. */
export const docsContentRoute = "/llms.mdx/docs";

const getContentUrl = createGetUrl(docsContentRoute);

/** URL for a docs page's raw Markdown — what `MarkdownCopyButton`/`ViewOptionsPopover` fetch. */
export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }): {
  segments: string[];
  url: string;
} {
  const segments = [...page.slugs, "content.md"];
  return { segments, url: getContentUrl(segments, page.locale) };
}
