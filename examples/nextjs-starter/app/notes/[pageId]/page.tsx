import type { Metadata } from "next";
import { NotesWorkspace } from "@/components/notes-workspace.tsx";

export const metadata: Metadata = {
  title: "Notes",
  description: "A Notion-style pages workspace: sub-pages, page links, backlinks and a page tree.",
};

export default async function NotesPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  return <NotesWorkspace pageId={pageId} />;
}
