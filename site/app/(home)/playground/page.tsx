import { Suspense } from "react";
import type { Metadata } from "next";
import { PlaygroundEditor } from "~/components/playground/playground-editor.preview.tsx";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "A live, editable slash-editor instance — every block, the slash menu, and inline formatting.",
};

export default function PlaygroundPage() {
  return (
    <main className="px-6 py-12">
      <Suspense fallback={null}>
        <PlaygroundEditor />
      </Suspense>
    </main>
  );
}
