import type { Metadata } from "next";
import { CollabLobby } from "@/components/collab-lobby.tsx";

export const metadata: Metadata = {
  title: "Collaboration",
  description: "Join a room and edit the same document in several tabs with live carets.",
};

export default function CollabPage() {
  return <CollabLobby />;
}
