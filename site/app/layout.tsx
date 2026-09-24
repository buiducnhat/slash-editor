import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import "./globals.css";

const SITE_URL = "https://slasheditor.dev";
const DESCRIPTION =
  "Notion-style block editor for React. A headless core on Tiptap/ProseMirror, React bindings, and a shadcn-native block UI you install as source and own outright. No paid tier, no hosted dependency.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "slash-editor — Notion-style block editor for React",
    template: "%s | slash-editor",
  },
  description: DESCRIPTION,
  keywords: [
    "slash-editor",
    "notion editor react",
    "block editor react",
    "tiptap block editor",
    "shadcn editor",
    "prosemirror block editor",
    "rich text editor react",
    "headless editor react",
    "slash command editor",
    "wysiwyg editor react",
  ],
  authors: [{ name: "Nhat Bui", url: "https://github.com/buiducnhat" }],
  creator: "Nhat Bui",
  publisher: "slash-editor",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "slash-editor — Notion-style block editor for React",
    description: DESCRIPTION,
    url: "/",
    siteName: "slash-editor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "slash-editor — Notion-style block editor for React",
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "slash-editor",
  operatingSystem: "Any",
  applicationCategory: "DeveloperApplication",
  description: DESCRIPTION,
  url: SITE_URL,
  license: "https://opensource.org/licenses/MIT",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Nhat Bui",
    url: "https://github.com/buiducnhat",
  },
};
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans flex min-h-screen flex-col">
        <RootProvider>
          <TooltipProvider delay={400}>{children}</TooltipProvider>
        </RootProvider>
      </body>
    </html>
  );
}
