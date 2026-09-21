import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { FeatureGrid } from "~/components/landing/feature-grid.tsx";
import { InstallCommand } from "~/components/registry/install-command.tsx";
import { SlashMenuDemo } from "~/components/demo/registry-demos.preview.tsx";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-6 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <p className="text-fd-muted-foreground text-sm font-medium tracking-wide uppercase">
          Headless core · shadcn UI you own · MIT end to end
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Notion-style block editing, without the paywall
        </h1>
        <p className="text-fd-muted-foreground max-w-2xl text-lg text-balance">
          A headless editor core on Tiptap/ProseMirror, React bindings, and a shadcn-native block UI
          you install as source and own outright. No paid tier, no hosted dependency.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/getting-started/installation"
            className="bg-fd-primary text-fd-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
          <Link
            href="/docs/components/slash-menu"
            className="border-fd-border inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Browse components
          </Link>
          <a
            href="https://github.com/buiducnhat/slash-editor"
            className="border-fd-border inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            <ExternalLinkIcon className="size-4" aria-hidden />
            GitHub
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-fd-muted-foreground text-center text-sm">
          Type <code>/</code> on an empty line — this is the real registry component, not a
          screenshot.
        </p>
        <SlashMenuDemo />
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
        <FeatureGrid />
      </section>

      <section className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Install</h2>
        <div className="w-full max-w-lg">
          <InstallCommand item="slash-editor-kit" />
        </div>
        <p className="text-fd-muted-foreground text-sm">
          See the{" "}
          <Link href="/docs/getting-started/registry" className="underline">
            registry setup
          </Link>{" "}
          for the one-time <code>components.json</code> step.
        </p>
      </section>
    </main>
  );
}
