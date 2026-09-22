import { notFound } from "next/navigation";
import { docsLlms, source } from "~/lib/source.ts";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
): Promise<Response> {
  const { slug } = await params;
  // `next.config.mjs` rewrites `/docs/*.md` here with `content.md` appended;
  // strip it back off before resolving the page.
  const slugs = slug?.slice(0, -1) ?? [];
  if (slugs.at(-1) === "index") slugs.pop();

  const page = source.getPage(slugs);
  if (!page) notFound();

  return new Response(await docsLlms.page(page), {
    headers: { "Content-Type": "text/markdown" },
  });
}

export function generateStaticParams() {
  return source.generateParams().map((item) => ({
    ...item,
    slug: [...item.slug, "content.md"],
  }));
}
