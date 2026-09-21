import { Link, usePathname } from "@/lib/router.tsx";
import { cn } from "@/lib/utils.ts";

const LINKS = [
  { to: "/", label: "Playground" },
  { to: "/docs", label: "Docs" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex items-center gap-4 text-sm">
      {LINKS.map((link) => {
        const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "text-muted-foreground hover:text-foreground font-medium transition-colors",
              active && "text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
