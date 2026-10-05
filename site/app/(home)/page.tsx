import { ArrowRightIcon } from "lucide-react";

import { PlaygroundDemo } from "~/components/demo/playground-demo.preview.tsx";
import { BuiltOn } from "~/components/landing/built-on.tsx";
import { FeatureBento } from "~/components/landing/feature-bento.tsx";
import { LinkButton } from "~/components/landing/link-button.tsx";
import { RegistryCatalog } from "~/components/landing/registry-catalog.tsx";
import { Reveal } from "~/components/landing/reveal.tsx";
import { SlashMarquee } from "~/components/landing/slash-marquee.tsx";
import { SiteFooter } from "~/components/landing/site-footer.tsx";

export default function HomePage() {
  return (
    <>
      <main className="flex w-full flex-col gap-24 overflow-x-clip pb-24 md:gap-32 md:pb-32">
        <div className="flex flex-col gap-12">
          <section className="relative mx-auto grid w-full max-w-[1400px] items-center gap-14 px-4 pt-12 md:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 right-0 -left-1/4 h-[720px] bg-[radial-gradient(50%_60%_at_70%_45%,var(--color-brand-soft),transparent)]"
            />

            <div className="relative flex flex-col items-start gap-7">
              <Reveal>
                <h1 className="text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
                  Block editing without{" "}
                  <span className="bg-brand text-brand-foreground rounded-lg px-3 pb-1 box-decoration-clone">
                    the paywall
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-muted-foreground max-w-[44ch] text-lg leading-relaxed md:text-xl">
                  A headless Tiptap core, React bindings, and a shadcn block UI you install as
                  source and own.
                </p>
              </Reveal>
              <Reveal delay={0.2} className="flex flex-wrap items-center gap-3">
                <LinkButton href="/docs/getting-started/installation">
                  Get started
                  <ArrowRightIcon className="size-4" strokeWidth={2} aria-hidden />
                </LinkButton>
                <LinkButton href="/playground" variant="secondary">
                  Live playground
                </LinkButton>
              </Reveal>
            </div>

            <Reveal delay={0.25} className="relative">
              <div
                aria-hidden
                className="bg-brand absolute inset-0 translate-x-3 translate-y-3 rounded-xl md:translate-x-5 md:translate-y-5"
              />
              <div className="relative">
                <PlaygroundDemo />
              </div>
            </Reveal>
          </section>

          <BuiltOn />
          <SlashMarquee />
        </div>

        <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-4 md:px-6">
          <Reveal inView className="flex flex-col gap-5">
            <h2 className="max-w-[18ch] text-4xl font-semibold tracking-tighter text-balance md:text-6xl">
              The block interaction model,{" "}
              <span className="text-muted-foreground">not just formatting buttons</span>
            </h2>
            <p className="text-muted-foreground max-w-[62ch] text-lg leading-relaxed">
              Free tiptap+shadcn projects stop at toolbars. Plate Plus charges €299 per developer
              for the block UI. slash-editor ships it as source you own, for free.
            </p>
          </Reveal>
          <Reveal inView>
            <FeatureBento />
          </Reveal>
        </section>

        <Reveal inView>
          <RegistryCatalog />
        </Reveal>

        <section className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <Reveal inView>
            <div className="bg-brand text-brand-foreground relative overflow-hidden rounded-xl px-6 py-16 md:px-14 md:py-24">
              <span
                aria-hidden
                className="text-brand-foreground/10 pointer-events-none absolute top-1/2 right-6 hidden -translate-y-1/2 leading-none font-semibold select-none md:block md:text-[30rem]"
              >
                /
              </span>
              <div className="relative flex max-w-3xl flex-col items-start gap-7">
                <h2 className="text-5xl font-semibold tracking-[-0.045em] text-balance md:text-7xl">
                  Install it, own it, ship it.
                </h2>
                <p className="max-w-[52ch] text-lg leading-relaxed opacity-80 md:text-xl">
                  Everything on this page is in the repository. Read it, restyle it with your
                  tokens, and ship it in your product.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <LinkButton href="/docs/getting-started/installation" variant="ink">
                    Get started
                    <ArrowRightIcon className="size-4" strokeWidth={2} aria-hidden />
                  </LinkButton>
                  <LinkButton
                    href="https://github.com/buiducnhat/slash-editor"
                    variant="inkOutline"
                  >
                    Star on GitHub
                  </LinkButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
