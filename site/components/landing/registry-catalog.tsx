import Link from "next/link";

import { CopyCommand } from "~/components/landing/copy-command.tsx";

/** Every item published in `site/registry.json`, grouped by job. */
const GROUPS = [
  {
    name: "Editing surfaces",
    items: [
      "slash-menu",
      "bubble-toolbar",
      "block-handle",
      "mention-menu",
      "emoji-menu",
      "link-editor-popover",
    ],
  },
  {
    name: "Collaboration",
    items: ["comment-panel", "comment-composer", "presence-avatars", "table-of-contents"],
  },
  {
    name: "Pages",
    items: ["page-header", "page-tree", "page-breadcrumb", "page-backlinks", "page-node-views"],
  },
  {
    name: "Node views",
    items: ["node-views", "mermaid-node-view", "code-block-node-view"],
  },
  { name: "Primitives", items: ["popover", "dropdown-menu", "icons"] },
];

const KIT_COMMAND = "bunx --bun shadcn@latest add @slash-editor/slash-editor-kit";

export function RegistryCatalog() {
  return (
    <section className="mx-auto grid w-full max-w-[1400px] gap-12 px-4 md:px-6 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col gap-10 lg:col-span-7">
        <div className="flex flex-col gap-3">
          <h2 className="max-w-[14ch] text-4xl font-semibold tracking-tighter text-balance md:text-6xl">
            <span className="text-brand">22</span> registry items. Take the kit or take one.
          </h2>
          <p className="text-muted-foreground max-w-[60ch] leading-relaxed">
            Every item is a standalone registry entry that copies its source into your repo, where
            you edit it like any other file.
          </p>
        </div>

        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.name} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">{group.name}</h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="border-border bg-muted/50 text-foreground/80 hover:border-brand hover:bg-brand-soft hover:text-foreground rounded-md border px-2.5 py-1 font-mono text-xs transition-colors duration-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <h3 className="text-xl font-semibold tracking-tight">One command installs the kit</h3>
          <CopyCommand command={KIT_COMMAND} />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Add the one-time{" "}
            <Link
              href="/docs/getting-started/registry"
              className="text-foreground underline underline-offset-4"
            >
              registry setup
            </Link>{" "}
            to <code className="font-mono text-[13px]">components.json</code> first, or{" "}
            <Link
              href="/docs/components/slash-menu"
              className="text-foreground underline underline-offset-4"
            >
              browse the components
            </Link>{" "}
            one by one.
          </p>
        </div>
      </div>
    </section>
  );
}
