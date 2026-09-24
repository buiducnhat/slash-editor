import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import "./globals.css";

const SITE_URL = "https://slash-editor-eta.vercel.app";
const DESCRIPTION =
  "Notion-style block editor for React. A headless core on Tiptap/ProseMirror, React bindings, and a shadcn-native block UI you install as source and own outright. No paid tier, no hosted dependency.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "slash-editor", template: "%s | slash-editor" },
  description: DESCRIPTION,
  openGraph: {
    title: "slash-editor",
    description: DESCRIPTION,
    url: "/",
    siteName: "slash-editor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "slash-editor",
    description: DESCRIPTION,
  },
};
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans flex min-h-screen flex-col">
        <RootProvider>
          <TooltipProvider delay={400}>{children}</TooltipProvider>
        </RootProvider>
      </body>
    </html>
  );
}
