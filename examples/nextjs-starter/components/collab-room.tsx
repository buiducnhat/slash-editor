"use client";

import { useEffect, useState } from "react";
import { CollabEditor } from "@/components/collab-editor.tsx";
import { type Collaboration, createCollaboration } from "@/lib/collaboration.ts";

function Skeleton() {
  return (
    <div className="bg-card border-border min-h-[60vh] animate-pulse rounded-xl border" aria-hidden />
  );
}

/**
 * Owns the room's `Y.Doc` and `WebrtcProvider`. They are created in an effect,
 * not during render: React StrictMode mounts, unmounts and remounts, so the
 * cleanup destroys the first pair and the second one is what the editor keeps.
 * The editor latches its extensions, so it only mounts once the session exists.
 *
 * The page keys this component by room, so a new room is a new session and the
 * effect never sees a stale one.
 */
export function CollabRoom({ room: segment }: { room: string }) {
  const [session, setSession] = useState<Collaboration | null>(null);

  // Dynamic segments may arrive percent-encoded (`my%20room`).
  let room = segment;
  try {
    room = decodeURIComponent(segment);
  } catch {
    // Malformed escape: use the segment as written.
  }

  useEffect(() => {
    const collaboration = createCollaboration(room);
    setSession(collaboration);

    return () => {
      collaboration.destroy();
      setSession(null);
    };
  }, [room]);

  return session ? <CollabEditor room={room} session={session} /> : <Skeleton />;
}
