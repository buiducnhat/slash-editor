import { redirect } from "next/navigation";
import { DEMO_ROOT_PAGE_ID } from "@/lib/page-store.ts";

export default function NotesIndexPage() {
  redirect(`/notes/${DEMO_ROOT_PAGE_ID}`);
}
