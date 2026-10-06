import type { Metadata } from "next";
import { ReadOnlyArticle } from "@/components/read-only-article.tsx";

export const metadata: Metadata = {
  title: "Read-only article",
  description: "A published-article view: editable: false, live links and an outline.",
};

export default function ReadOnlyPage() {
  return <ReadOnlyArticle />;
}
