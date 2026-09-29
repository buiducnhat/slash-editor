import {
  BlocksIcon,
  KeyboardIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
  WandSparklesIcon,
  type LucideIcon,
} from "lucide-react";

import { BentoCard, BentoGrid } from "~/components/magicui/bento-grid.tsx";
import { DotPattern } from "~/components/magicui/dot-pattern.tsx";
import { Marquee } from "~/components/magicui/marquee.tsx";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  /** Grid footprint of the card. */
  className: string;
  background: React.ReactNode;
}

const SLASH_CHIPS = [
  "/h1",
  "/todo",
  "/table",
  "/columns",
  "/mermaid",
  "/callout",
  "/image",
  "/embed",
  "/toggle",
  "/quote",
  "/divider",
  "/ai",
];

const LICENSE_CHIPS = [
  "MIT",
  "no paid tier",
  "no hosted dependency",
  "no relicensing risk",
  "source you own",
];

function ChipMarquee({
  items,
  className,
  rows = 1,
}: {
  items: string[];
  className?: string;
  rows?: number;
}) {
  return (
    <div className={className}>
      {Array.from({ length: rows }, (_, row) => (
        <Marquee
          key={row}
          pauseOnHover
          reverse={row % 2 === 1}
          className="[--duration:30s] [--gap:0.75rem]"
        >
          {items.map((item) => (
            <span
              key={item}
              className="border-border bg-muted text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap"
            >
              {item}
            </span>
          ))}
        </Marquee>
      ))}
    </div>
  );
}

const Dots = (
  <DotPattern className="text-foreground/15 [mask-image:radial-gradient(120%_80%_at_80%_0%,black,transparent)]" />
);

const FEATURES: Feature[] = [
  {
    icon: KeyboardIcon,
    title: "Keyboard-first block UX",
    description:
      "Slash insertion, hover drag handles, reordering, nesting, block comments — the interaction model free tiptap+shadcn projects stop short of.",
    href: "/docs/guides/slash-items",
    cta: "See the slash menu",
    className: "sm:col-span-2 lg:col-span-2",
    background: (
      <ChipMarquee
        items={SLASH_CHIPS}
        rows={2}
        className="pointer-events-none absolute inset-x-0 top-0 opacity-70"
      />
    ),
  },
  {
    icon: BlocksIcon,
    title: "Headless core, any UI",
    description:
      "@slash-editor/core is Tiptap/ProseMirror extensions and commands only — no React, no CSS. The same logic can back another renderer later.",
    href: "/docs/api/core",
    cta: "Read the core API",
    className: "sm:col-span-1 lg:col-span-1",
    background: Dots,
  },
  {
    icon: ScaleIcon,
    title: "You own the markup",
    description:
      "The rendered UI installs as source through a shadcn registry, not a locked component library. Restyle with your own tokens from day one.",
    href: "/docs/getting-started/registry",
    cta: "How the registry works",
    className: "sm:col-span-1 lg:col-span-1",
    background: Dots,
  },
  {
    icon: UsersIcon,
    title: "Real-time collaboration",
    description:
      "Yjs + Hocuspocus, self-hosted — presence carets and a comment thread store included, no hosted sync server to pay for.",
    href: "/docs/guides/collaboration",
    cta: "Wire up collaboration",
    className: "sm:col-span-1 lg:col-span-1",
    background: Dots,
  },
  {
    icon: WandSparklesIcon,
    title: "AI slash actions",
    description:
      "Continue writing, summarize, brainstorm, fix grammar — streamed through a StreamAdapter you implement against any model.",
    href: "/docs/guides/ai-stream-adapter",
    cta: "Implement an adapter",
    className: "sm:col-span-1 lg:col-span-1",
    background: Dots,
  },
  {
    icon: ShieldCheckIcon,
    title: "100% MIT",
    description:
      "No paid tier, no hosted dependency, no relicensing risk hiding behind a free tier. Every dependency in the graph is MIT.",
    href: "/docs",
    cta: "Read the docs",
    className: "sm:col-span-2 lg:col-span-3",
    background: (
      <ChipMarquee
        items={LICENSE_CHIPS}
        rows={2}
        className="pointer-events-none absolute inset-x-0 top-0 opacity-70"
      />
    ),
  },
];

export function FeatureBento() {
  return (
    <BentoGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <BentoCard
          key={feature.title}
          Icon={feature.icon}
          name={feature.title}
          description={feature.description}
          href={feature.href}
          cta={feature.cta}
          className={feature.className}
          background={feature.background}
        />
      ))}
    </BentoGrid>
  );
}
