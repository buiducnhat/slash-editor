import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { DemoIcon } from "@/components/demo-icon.tsx";
import { buttonVariants } from "@/components/ui/button.tsx";
import { DEMOS } from "@/lib/demos.ts";

const FEATURES = [
  ["Blocks", "Headings, lists, tasks, toggles, callouts, columns, tables, code, Mermaid"],
  ["Media", "Image, video, file and embed blocks behind an upload adapter"],
  ["Collaboration", "Yjs sync, live carets, presence avatars, block-anchored comments"],
  ["AI", "Slash, selection and block actions through a stream adapter"],
  ["Documents", "Sub-pages, page links, backlinks, outline, read-only mode"],
  ["Markdown", "Import, export and input shortcuts"],
  ["Localization", "Every menu and placeholder through the messages option"],
  ["Ownership", "All UI is source in components/, installed from the shadcn registry"],
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-6">
      <section className="flex flex-col items-start gap-5">
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
          Next.js · Tailwind v4 · shadcn · slash-editor
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          A complete block-editor starter for Next.js
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
          Nine working demos covering every slash-editor feature, each backed by route handlers and
          adapters you can swap for your own backend.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/editor" className={buttonVariants({ size: "lg" })}>
            Open the editor
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
          <a
            href="https://slasheditor.dev/docs"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Read the docs
          </a>
        </div>
      </section>

      <section aria-labelledby="demos" className="flex flex-col gap-4">
        <h2 id="demos" className="text-lg font-semibold tracking-tight">
          Demos
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((demo) => (
            <li key={demo.href}>
              <Link
                href={demo.href}
                className="bg-card border-border hover:border-ring/60 hover:bg-muted/40 flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors"
              >
                <span className="bg-muted flex size-9 items-center justify-center rounded-lg">
                  <DemoIcon name={demo.icon} className="size-4" />
                </span>
                <span className="font-medium">{demo.title}</span>
                <span className="text-muted-foreground text-sm">{demo.description}</span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {demo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="features" className="flex flex-col gap-4">
        <h2 id="features" className="text-lg font-semibold tracking-tight">
          What&apos;s included
        </h2>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FEATURES.map(([name, text]) => (
            <div key={name} className="flex flex-col gap-0.5">
              <dt className="text-sm font-medium">{name}</dt>
              <dd className="text-muted-foreground text-sm">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
