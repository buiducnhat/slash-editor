import type { Metadata } from "next";
import { AiDemo } from "@/components/ai-demo.tsx";

export const metadata: Metadata = {
  title: "AI writing",
  description: "Streamed AI actions from the slash menu, the bubble toolbar and the block handle.",
};

export default function AiPage() {
  return <AiDemo />;
}
