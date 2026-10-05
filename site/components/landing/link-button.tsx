import Link from "next/link";

import { cn } from "@/lib/utils.ts";

const BASE =
  "focus-visible:outline-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] motion-safe:hover:-translate-y-px";

const VARIANTS = {
  /** The one loud action on a surface: accent fill, dark ink. */
  primary: "bg-brand text-brand-foreground hover:bg-brand/90",
  secondary: "border-border bg-background text-foreground hover:bg-muted border",
  /** For use on a solid accent surface. */
  ink: "bg-brand-foreground text-brand hover:bg-brand-foreground/90",
  inkOutline:
    "border-brand-foreground/40 text-brand-foreground hover:bg-brand-foreground/10 border",
} as const;

interface LinkButtonProps {
  href: string;
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}

/** Internal links use next/link; absolute URLs open as plain anchors. */
export function LinkButton({ href, variant = "primary", children, className }: LinkButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], className);
  if (href.startsWith("http")) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
