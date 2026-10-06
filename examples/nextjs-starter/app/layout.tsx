import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header.tsx";
import { THEME_SCRIPT } from "@/components/theme-toggle.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: { default: "slash-editor starter", template: "%s · slash-editor starter" },
  description: "Notion-style block editor for React, built with slash-editor, Next.js and shadcn.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <TooltipProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
