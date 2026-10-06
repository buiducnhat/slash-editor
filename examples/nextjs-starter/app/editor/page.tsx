import type { Metadata } from "next";
import { FullEditor } from "@/components/full-editor.tsx";

export const metadata: Metadata = {
  title: "Full editor",
  description: "Every slash-editor block and surface in one autosaving document.",
};

export default function EditorPage() {
  return <FullEditor />;
}
