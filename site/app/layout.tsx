import { RootProvider } from "fumadocs-ui/provider/next";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import "./globals.css";

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
