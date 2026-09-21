import { Link } from "@/lib/router.tsx";
import { REGISTRY_ITEMS } from "@/lib/registry-items.ts";
import { cn } from "@/lib/utils.ts";
import { DocsItemPage } from "@/routes/docs-item.tsx";
import { DocsOverview } from "@/routes/docs-overview.tsx";

function DocsSidebar({ activeSlug }: { activeSlug: string | null }) {
  const linkClass = (active: boolean) =>
    cn(
      "block rounded-md px-2 py-1.5 text-sm transition-colors",
      active
        ? "bg-muted text-foreground font-medium"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  return (
    <nav className="w-48 shrink-0">
      <Link to="/docs" className={linkClass(activeSlug === null)}>
        Overview
      </Link>
      <div className="text-muted-foreground mt-4 mb-1 px-2 text-xs font-medium tracking-wide uppercase">
        Components
      </div>
      {REGISTRY_ITEMS.map((item) => (
        <Link
          key={item.slug}
          to={`/docs/${item.slug}`}
          className={linkClass(activeSlug === item.slug)}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

/** `/docs` (overview) and `/docs/:item` (one live page per registry item). */
export function DocsApp({ pathname }: { pathname: string }) {
  const slug = pathname === "/docs" ? null : decodeURIComponent(pathname.slice("/docs/".length));
  const item = slug ? REGISTRY_ITEMS.find((candidate) => candidate.slug === slug) : undefined;

  return (
    <main className="bg-background min-h-screen py-12">
      <div className="mx-auto flex w-full max-w-4xl gap-8 px-6">
        <DocsSidebar activeSlug={slug ?? null} />
        <div className="min-w-0 flex-1">
          {slug === null ? (
            <DocsOverview />
          ) : item ? (
            <DocsItemPage item={item} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No registry item named “{slug}”.{" "}
              <Link to="/docs" className="underline">
                Back to overview
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
