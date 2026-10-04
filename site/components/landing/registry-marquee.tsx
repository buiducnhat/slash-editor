import { Marquee } from "~/components/magicui/marquee.tsx";

/** The 16 items published in the registry, as a scrolling catalog. */
const ROW_ONE = [
  "slash-menu",
  "block-handle",
  "bubble-toolbar",
  "mention-menu",
  "emoji-menu",
  "link-editor-popover",
  "comment-panel",
  "comment-composer",
];

const ROW_TWO = [
  "table-of-contents",
  "node-views",
  "mermaid-node-view",
  "presence-avatars",
  "icons",
  "popover",
  "dropdown-menu",
  "slash-editor-kit",
];

function ItemPill({ name }: { name: string }) {
  return (
    <span className="border-border bg-background text-foreground/80 rounded-full border px-3 py-1 font-mono text-xs whitespace-nowrap">
      {name}
    </span>
  );
}

export function RegistryMarquee() {
  return (
    <section className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Fifteen registry items. Take the kit — or take one.
        </h2>
        <p className="text-fd-muted-foreground mx-auto mt-2 max-w-2xl">
          Every item is a standalone registry entry.{" "}
          <code>bunx --bun shadcn@latest add @slash-editor/&lt;name&gt;</code> copies its source
          into your repo, where you can edit it like any other file.
        </p>
      </div>
      <div className="flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <Marquee pauseOnHover className="[--duration:60s]">
          {ROW_ONE.map((name) => (
            <ItemPill key={name} name={name} />
          ))}
        </Marquee>
        <Marquee pauseOnHover reverse className="[--duration:60s]">
          {ROW_TWO.map((name) => (
            <ItemPill key={name} name={name} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
