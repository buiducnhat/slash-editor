import type { Metadata } from "next";
import { MarkdownDemo } from "@/components/markdown-demo.tsx";

export const metadata: Metadata = {
  title: "Markdown",
  description: "Two-way markdown source and document, with import, export and shortcut reference.",
};

export default function MarkdownPage() {
  return <MarkdownDemo />;
}
