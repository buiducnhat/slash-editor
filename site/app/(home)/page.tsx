import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { AnimatedShinyText } from "~/components/magicui/animated-shiny-text.tsx";
import { BlurFade } from "~/components/magicui/blur-fade.tsx";
import { BorderBeam } from "~/components/magicui/border-beam.tsx";
import { DotPattern } from "~/components/magicui/dot-pattern.tsx";
import { NumberTicker } from "~/components/magicui/number-ticker.tsx";
import { ShimmerButton } from "~/components/magicui/shimmer-button.tsx";
import { AnimatedSpan, Terminal, TypingAnimation } from "~/components/magicui/terminal.tsx";
import { FeatureBento } from "~/components/landing/feature-bento.tsx";
import { RegistryMarquee } from "~/components/landing/registry-marquee.tsx";
import { PlaygroundDemo } from "~/components/demo/playground-demo.preview.tsx";

const INSTALL_COMMAND = "$ bunx --bun shadcn@latest add @slash-editor/slash-editor-kit";

function Stat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-3xl font-semibold tracking-tight">
        <NumberTicker value={value} />
        {suffix}
      </p>
      <p className="text-fd-muted-foreground text-center text-sm">{label}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-24 px-6 py-16">
      <section className="relative flex flex-col items-center gap-6 pt-6 text-center">
        <DotPattern className="text-foreground/20 -z-10 [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />

        <BlurFade>
          <div className="border-border bg-background/60 inline-flex rounded-full border px-3 py-1">
            <AnimatedShinyText className="text-foreground/80 text-xs font-medium">
              MIT end to end · shadcn registry · Tiptap core
            </AnimatedShinyText>
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Notion-style block editing,{" "}
            <span className="bg-linear-to-r from-violet-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              without the paywall
            </span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.2}>
          <p className="text-fd-muted-foreground max-w-2xl text-lg text-balance">
            A headless editor core on Tiptap/ProseMirror, React bindings, and a shadcn-native block
            UI you install as source and own outright. No paid tier, no hosted dependency.
          </p>
        </BlurFade>

        <BlurFade delay={0.3}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton
              href="/docs/getting-started/installation"
              background="var(--color-primary)"
              shimmerColor="#a78bfa"
              className="text-primary-foreground h-10 rounded-full px-5 text-sm font-medium"
            >
              Get started
              <ArrowRightIcon className="ml-1.5 size-4" aria-hidden />
            </ShimmerButton>
            <Link
              href="/docs/components/slash-menu"
              className="border-fd-border inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              Browse components
            </Link>
            <Link
              href="/playground"
              className="border-fd-border inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              Live playground
            </Link>
            <a
              href="https://github.com/buiducnhat/slash-editor"
              className="border-fd-border inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              <ExternalLinkIcon className="size-4" aria-hidden />
              GitHub
            </a>
          </div>
        </BlurFade>

        <BlurFade delay={0.4} className="mt-8 w-full">
          <div className="border-fd-border mx-auto grid w-full max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-y py-6 sm:grid-cols-4">
            <Stat value={15} label="registry items" />
            <Stat value={100} suffix="%" label="MIT licensed" />
            <Stat value={2} label="packages: core + react" />
            <Stat value={0} label="paid tiers" />
          </div>
        </BlurFade>
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-fd-muted-foreground text-center text-sm">
          Type <code>/</code> on an empty line — this is the real registry component, not a
          screenshot.
        </p>
        <div className="relative rounded-xl">
          <BorderBeam colorFrom="#8b5cf6" colorTo="#38bdf8" />
          <PlaygroundDemo />
        </div>
        <p className="text-fd-muted-foreground text-center text-sm">
          <Link href="/playground" className="underline">
            Open the full playground
          </Link>{" "}
          for comments, mentions, and media uploads.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            The block interaction model, not just formatting buttons
          </h2>
          <p className="text-fd-muted-foreground mx-auto mt-2 max-w-2xl">
            Free tiptap+shadcn projects are toolbar-grade. Plate Plus charges €299/dev for the block
            UI. slash-editor ships it as source you own, for free.
          </p>
        </div>
        <BlurFade inView>
          <FeatureBento />
        </BlurFade>
      </section>

      <BlurFade inView>
        <RegistryMarquee />
      </BlurFade>

      <section className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">One command</h2>
          <p className="text-fd-muted-foreground mx-auto mt-2 max-w-2xl">
            The kit installs every item above as source. Add the one-time{" "}
            <Link href="/docs/getting-started/registry" className="underline">
              registry setup
            </Link>{" "}
            to <code>components.json</code> first.
          </p>
        </div>
        <BlurFade inView>
          <Terminal className="max-w-2xl">
            <TypingAnimation as="div" duration={25} className="text-foreground">
              {INSTALL_COMMAND}
            </TypingAnimation>
            <AnimatedSpan className="text-fd-muted-foreground">
              <span>✔ installed as source — yours to edit, restyle, and ship</span>
            </AnimatedSpan>
            <AnimatedSpan delay={200} className="text-fd-muted-foreground">
              <span># MIT end to end. No paid tier, no hosted dependency.</span>
            </AnimatedSpan>
          </Terminal>
        </BlurFade>
      </section>

      <section className="border-fd-border relative overflow-hidden rounded-2xl border px-8 py-14">
        <DotPattern className="text-foreground/10 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
            Install it, own it, ship it.
          </h2>
          <p className="text-fd-muted-foreground max-w-xl text-balance">
            Everything this page shows is in the repository — extensions, commands, and the block
            UI. Read it, restyle it with your tokens, and ship it in your product.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton
              href="/docs/getting-started/quick-start"
              background="var(--color-primary)"
              shimmerColor="#a78bfa"
              className="text-primary-foreground h-10 rounded-full px-5 text-sm font-medium"
            >
              Quick start
              <ArrowRightIcon className="ml-1.5 size-4" aria-hidden />
            </ShimmerButton>
            <a
              href="https://github.com/buiducnhat/slash-editor"
              className="border-fd-border inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              <ExternalLinkIcon className="size-4" aria-hidden />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
