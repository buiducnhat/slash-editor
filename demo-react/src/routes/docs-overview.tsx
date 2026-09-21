import { Link } from "@/lib/router.tsx";
import {
  KIT_SLUG,
  REGISTRY_ITEMS,
  addCommand,
  registryConfigSnippet,
} from "@/lib/registry-items.ts";
import { CodeBlock, InstallCommand } from "@/components/install-command.tsx";

export function DocsOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium tracking-tight">slash-editor components</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every item below is a real shadcn registry entry, built from this repo's own source by{" "}
          <code>shadcn build</code> — install any one on its own, or everything at once.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">1. Add this registry (once per project)</h2>
        <p className="text-muted-foreground text-xs">
          Add to <code>components.json</code> — several components depend on this repo's own
          anchor-aware <code>popover</code>/<code>dropdown-menu</code>, so a raw registry URL can't
          resolve them on its own.
        </p>
        <CodeBlock code={registryConfigSnippet()} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">2. Install everything</h2>
        <InstallCommand command={addCommand(KIT_SLUG)} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Components</h2>
        <ul className="divide-border border-border divide-y rounded-lg border">
          {REGISTRY_ITEMS.map((item) => (
            <li key={item.slug} className="p-3">
              <Link to={`/docs/${item.slug}`} className="text-sm font-medium hover:underline">
                {item.title}
              </Link>
              <p className="text-muted-foreground mt-0.5 text-xs">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
