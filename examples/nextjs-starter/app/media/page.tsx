import type { Metadata } from "next";
import { MediaDemo } from "@/components/media-demo.tsx";

export const metadata: Metadata = {
  title: "Media & embeds",
  description: "Image, file and video uploads with drag-and-drop, paste, retry and embeds.",
};

export default function MediaPage() {
  return <MediaDemo />;
}
