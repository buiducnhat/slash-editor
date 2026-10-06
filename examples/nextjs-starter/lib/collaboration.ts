import type { CollaborationUser } from "@slash-editor/core";
import { WebrtcProvider } from "y-webrtc";
import { Doc as YDoc } from "yjs";

/**
 * `y-webrtc`'s built-in public signaling servers are gone, so the starter
 * ships without any. With an empty list the provider still syncs every tab of
 * the *same browser* through `BroadcastChannel`, which is what makes the demo
 * work with zero configuration. To collaborate across devices, run a
 * signaling server (`npx y-webrtc-signaling`, listening on :4444) and point
 * `NEXT_PUBLIC_WEBRTC_SIGNALING_URL` at it, e.g. `ws://localhost:4444`.
 * Several URLs may be comma-separated.
 *
 * Signaling only relays WebRTC connection setup; document and awareness
 * updates flow directly between browsers.
 */
function signalingServers(): string[] {
  return (process.env.NEXT_PUBLIC_WEBRTC_SIGNALING_URL ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

const USER_COLORS = ["#F87171", "#FB923C", "#FBBF24", "#4ADE80", "#22D3EE", "#818CF8", "#F472B6"];
const USER_KEY = "slash-editor-starter:collab:user";

function randomUser(): CollaborationUser {
  return {
    name: `Guest-${Math.random().toString(36).slice(2, 6)}`,
    color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]!,
  };
}

/**
 * The identity shown to other collaborators. It lives in `sessionStorage`, so
 * a refresh keeps the same name and color while a new tab is a new "person".
 */
export function getSessionUser(): CollaborationUser {
  try {
    const stored = sessionStorage.getItem(USER_KEY);
    if (stored) return JSON.parse(stored) as CollaborationUser;

    const user = randomUser();
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    // Storage blocked or corrupt: fall back to an identity for this mount only.
    return randomUser();
  }
}

export interface Collaboration {
  document: YDoc;
  provider: WebrtcProvider;
  user: CollaborationUser;
  /** Leaves the room and releases the document. */
  destroy: () => void;
}

/**
 * Wires a shared `Y.Doc` and a `WebrtcProvider` for `room`. The host owns both:
 * core only ever receives them through `blockKit.collaboration`. Call it from
 * an effect and `destroy()` in the cleanup, so StrictMode's mount, unmount,
 * remount leaves exactly one provider per room.
 */
export function createCollaboration(room: string): Collaboration {
  const document = new YDoc();
  const provider = new WebrtcProvider(room, document, { signaling: signalingServers() });

  return {
    document,
    provider,
    user: getSessionUser(),
    destroy() {
      // `disconnect` releases the shared signaling sockets, which `destroy` leaves open.
      provider.disconnect();
      provider.destroy();
      document.destroy();
    },
  };
}
