"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DemoIcon } from "@/components/demo-icon.tsx";
import { ThemeToggle } from "@/components/theme-toggle.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { DEMOS } from "@/lib/demos.ts";
import { cn } from "@/lib/utils.ts";

const REPO_URL = "https://github.com/buiducnhat/slash-editor";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sticky top bar: brand, the demo list (a menu on small screens), theme toggle, and repo link. */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/80 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="size-6 dark:invert" />
          slash-editor
        </Link>

        <nav aria-label="Demos" className="hidden flex-1 items-center gap-1 lg:flex">
          {DEMOS.map((demo) => (
            <Link
              key={demo.href}
              href={demo.href}
              aria-current={isActive(pathname, demo.href) ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm transition-colors",
                isActive(pathname, demo.href) && "text-foreground bg-muted font-medium",
              )}
            >
              {demo.short}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <MenuIcon aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {DEMOS.map((demo) => (
                <DropdownMenuItem key={demo.href} render={<Link href={demo.href} />}>
                  <DemoIcon name={demo.icon} />
                  {demo.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          <Button
            variant="ghost"
            render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            GitHub
          </Button>
        </div>
      </div>
    </header>
  );
}
