import type { Metadata } from "next";
import { CollabRoom } from "@/components/collab-room.tsx";

export const metadata: Metadata = {
  title: "Collaboration room",
  description: "A shared document synced peer to peer with Yjs and WebRTC.",
};

export default async function CollabRoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;

  // The editor latches its extensions, so a different room is a different tree.
  return <CollabRoom key={room} room={room} />;
}
