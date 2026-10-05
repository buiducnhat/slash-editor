import Image from "next/image";
import Link from "next/link";

const REPO = "https://github.com/buiducnhat/slash-editor";

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Docs",
    links: [
      { label: "Installation", href: "/docs/getting-started/installation" },
      { label: "Quick start", href: "/docs/getting-started/quick-start" },
      { label: "Components", href: "/docs/components/slash-menu" },
      { label: "Guides", href: "/docs/guides/block-kit" },
      { label: "API reference", href: "/docs/api/core" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Playground", href: "/playground" },
      { label: "GitHub", href: REPO },
      { label: "Releases", href: `${REPO}/releases` },
      { label: "Changelog", href: `${REPO}/blob/main/CHANGELOG.md` },
      { label: "llms.txt", href: "/llms.txt" },
    ],
  },
  {
    title: "Packages",
    links: [
      { label: "@slash-editor/core", href: "https://www.npmjs.com/package/@slash-editor/core" },
      { label: "@slash-editor/react", href: "https://www.npmjs.com/package/@slash-editor/react" },
    ],
  },
];

const LINK_CLASS =
  "text-muted-foreground hover:text-foreground focus-visible:outline-ring rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";

function FooterAnchor({ label, href }: FooterLink) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={LINK_CLASS}>
        {label}
      </a>
    );
  }
  // llms.txt is a plain text route, not a page: skip client navigation.
  if (href.endsWith(".txt")) {
    return (
      <a href={href} className={LINK_CLASS}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={LINK_CLASS}>
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-border overflow-hidden border-t">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-14 px-4 pt-16 md:px-6 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-4 lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="bg-brand flex size-8 items-center justify-center rounded-lg">
                <Image src="/logo.png" alt="" width={20} height={20} />
              </span>
              slash-editor
            </Link>
            <p className="text-muted-foreground max-w-[36ch] leading-relaxed">
              Notion-style block editor for React. Headless core, shadcn UI, MIT licensed.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7"
          >
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h2 className="text-sm font-medium">{column.title}</h2>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <FooterAnchor {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="text-muted-foreground flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            {`© ${new Date().getFullYear()} `}
            <a
              href="https://github.com/buiducnhat"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Nhat Bui
            </a>
          </p>
          <a
            href={`${REPO}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-4 transition-colors"
          >
            MIT License
          </a>
        </div>

        {/* Oversized wordmark resting on the footer's bottom edge. */}
        <p
          aria-hidden
          className="-mb-[0.04em] text-[clamp(3rem,13vw,12rem)] leading-none font-semibold tracking-[-0.06em] whitespace-nowrap select-none"
        >
          <span className="text-brand">/</span>
          <span className="text-transparent [-webkit-text-stroke:1.5px_color-mix(in_oklab,var(--foreground)_28%,transparent)]">
            slash-editor
          </span>
        </p>
      </div>
    </footer>
  );
}
