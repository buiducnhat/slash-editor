import {
  ArrowUpRightIcon,
  BlocksIcon,
  KeyboardIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
  WandSparklesIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { SpotlightCard } from "~/components/landing/spotlight-card.tsx";
import { cn } from "@/lib/utils.ts";

/*
 * Shape rule for the landing page: containers rounded-xl, buttons and inputs
 * rounded-lg, chips rounded-md.
 */

const SLASH_ITEMS = [
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

const COLLAB_ITEMS = ["Yjs", "Hocuspocus", "Presence carets", "Comment threads"];
const AI_ITEMS = ["Continue writing", "Summarize", "Brainstorm", "Fix grammar"];

const TINT = "bg-[radial-gradient(110%_90%_at_100%_0%,var(--color-brand-soft),transparent_65%)]";
const GRID =
  "bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:18px_18px]";

function Chip({ children, mono = true }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "border-border bg-background/80 text-foreground/80 rounded-md border px-2.5 py-1 text-xs whitespace-nowrap",
        mono && "font-mono",
      )}
    >
      {children}
    </span>
  );
}

function Cell({
  className,
  background,
  icon: Icon,
  title,
  href,
  cta,
  children,
  extra,
}: {
  className: string;
  background: string;
  icon: LucideIcon;
  title: string;
  href: string;
  cta: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <SpotlightCard className={cn(background, className)}>
      <Icon className="text-brand size-7" strokeWidth={1.5} aria-hidden />
      <div className="relative flex flex-col gap-3">
        <h3 className="text-2xl font-semibold tracking-tighter md:text-3xl">{title}</h3>
        <p className="text-muted-foreground max-w-[56ch] leading-relaxed">{children}</p>
      </div>
      {extra}
      <Link
        href={href}
        className="text-foreground focus-visible:outline-ring mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium underline-offset-4 outline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-2"
      >
        {cta}
        <ArrowUpRightIcon
          className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          strokeWidth={1.5}
          aria-hidden
        />
      </Link>
    </SpotlightCard>
  );
}

const STATS = [
  { value: "22", label: "registry items" },
  { value: "100%", label: "MIT licensed" },
  { value: "2", label: "packages: core and react" },
  { value: "0", label: "paid tiers" },
];

export function FeatureBento() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <Cell
        className="md:col-span-7"
        background={TINT}
        icon={KeyboardIcon}
        title="Keyboard-first block UX"
        href="/docs/guides/slash-items"
        cta="See the slash menu"
        extra={
          <ul className="relative flex flex-wrap gap-2" aria-label="Default slash items">
            {SLASH_ITEMS.map((item) => (
              <li key={item}>
                <Chip>{item}</Chip>
              </li>
            ))}
          </ul>
        }
      >
        Slash insertion, hover drag handles, reordering, nesting and block comments. The interaction
        model free tiptap+shadcn projects stop short of.
      </Cell>

      <Cell
        className="md:col-span-5"
        background={GRID}
        icon={BlocksIcon}
        title="Headless core, any UI"
        href="/docs/api/core"
        cta="Read the core API"
        extra={
          <pre className="border-border bg-background relative overflow-x-auto rounded-lg border p-4 font-mono text-[12.5px] leading-relaxed">
            <span className="text-muted-foreground">import</span> {"{ createBlockKit }"}{" "}
            <span className="text-muted-foreground">from</span>{" "}
            <span className="text-brand">"@slash-editor/core"</span>;{"\n\n"}
            <span className="text-muted-foreground">const</span> extensions = createBlockKit(
            {"{ image: false }"});
          </pre>
        }
      >
        @slash-editor/core is Tiptap/ProseMirror extensions and commands only. No React, no CSS.
      </Cell>

      <Cell
        className="md:col-span-5"
        background={GRID}
        icon={ScaleIcon}
        title="You own the markup"
        href="/docs/getting-started/registry"
        cta="How the registry works"
      >
        The rendered UI installs as source through a shadcn registry, not a locked component
        library. Restyle it with your own tokens from day one.
      </Cell>

      <Cell
        className="md:col-span-7"
        background={TINT}
        icon={UsersIcon}
        title="Real-time collaboration"
        href="/docs/guides/collaboration"
        cta="Wire up collaboration"
        extra={
          <ul className="relative flex flex-wrap gap-2">
            {COLLAB_ITEMS.map((item) => (
              <li key={item}>
                <Chip mono={false}>{item}</Chip>
              </li>
            ))}
          </ul>
        }
      >
        Self-hosted Yjs and Hocuspocus, with presence carets and a comment thread store included. No
        hosted sync server to pay for.
      </Cell>

      <Cell
        className="md:col-span-4"
        background={TINT}
        icon={WandSparklesIcon}
        title="AI slash actions"
        href="/docs/guides/ai-stream-adapter"
        cta="Implement an adapter"
        extra={
          <ul className="relative flex flex-wrap gap-2">
            {AI_ITEMS.map((item) => (
              <li key={item}>
                <Chip mono={false}>{item}</Chip>
              </li>
            ))}
          </ul>
        }
      >
        Streamed through a StreamAdapter you write against any model.
      </Cell>

      <Cell
        className="md:col-span-8"
        background={GRID}
        icon={ShieldCheckIcon}
        title="MIT end to end"
        href="/docs"
        cta="Read the docs"
        extra={
          <dl className="relative grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="text-muted-foreground text-xs">{stat.label}</dt>
                <dd className="text-brand font-mono text-5xl font-medium tracking-tighter md:text-6xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        }
      >
        No paid tier, no hosted dependency, no relicensing risk. Every dependency in the graph is
        MIT.
      </Cell>
    </div>
  );
}
