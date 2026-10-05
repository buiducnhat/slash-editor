import { siProsemirror, siReact, siShadcnui, siTailwindcss, siTypescript } from "simple-icons";

const LOGOS = [siProsemirror, siReact, siShadcnui, siTailwindcss, siTypescript];

/** Logo wall: marks only, sourced from the `simple-icons` package. */
export function BuiltOn() {
  return (
    <section className="border-border mx-auto w-full max-w-[1400px] border-y px-4 md:px-6">
      <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12">
        <p className="text-muted-foreground shrink-0 text-sm">Built on</p>
        <ul className="text-foreground/70 grid flex-1 grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 md:flex md:justify-between">
          {LOGOS.map((logo) => (
            <li key={logo.slug} className="flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-label={logo.title}
                className="size-6 shrink-0 fill-current"
              >
                <path d={logo.path} />
              </svg>
              <span aria-hidden className="text-sm font-medium tracking-tight">
                {logo.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
