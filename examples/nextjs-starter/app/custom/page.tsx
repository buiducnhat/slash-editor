import type { Metadata } from "next";
import { CustomBlocksDemo } from "@/components/custom-blocks-demo.tsx";

export const metadata: Metadata = {
  title: "Custom blocks",
  description:
    "Extend the kit with your own Tiptap node, React node view, slash item and toolbar action.",
};

export default function CustomPage() {
  return <CustomBlocksDemo />;
}
