import { WebrtcProvider } from "y-webrtc";
import { Doc as YDoc } from "yjs";

/**
 * `y-webrtc`'s default public signaling servers are dead (Heroku killed
 * the free dynos they ran on; `signaling.yjs.dev` doesn't resolve either
 * — see the collaboration guide). Signal peers through this deployment's
 * own `/api/signaling` Vercel WebSocket Function instead — same origin,
 * so no CORS/config needed. Peers exchange only WebRTC connection info
 * there; the actual document and awareness updates never touch it, they
 * flow directly between browsers once connected. Override with a
 * comma-separated list (e.g. the local `y-webrtc-signaling` test server
 * `playwright.config.ts` starts, or your own self-hosted instance) via
 * `NEXT_PUBLIC_WEBRTC_SIGNALING_URL`.
 */
function defaultSignalingUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/signaling`;
}

function signalingServers(): string[] {
  const override = process.env.NEXT_PUBLIC_WEBRTC_SIGNALING_URL;
  return override
    ? override
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)
    : [defaultSignalingUrl()];
}

const USER_COLORS = ["#F87171", "#FB923C", "#FBBF24", "#4ADE80", "#22D3EE", "#818CF8", "#F472B6"];

function randomUser(): { name: string; color: string } {
  const suffix = Math.random().toString(36).slice(2, 6);
  return {
    name: `Guest-${suffix}`,
    color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]!,
  };
}

export interface DemoCollaboration {
  document: YDoc;
  provider: WebrtcProvider;
  user: { name: string; color: string };
  destroy: () => void;
}

/**
 * Wires a shared `Y.Doc` and a `WebrtcProvider` for `room` — true
 * peer-to-peer, no central server. This is what makes the playground
 * demoable on a static deployment: unlike the `collab-server.ts`
 * Hocuspocus recipe (still documented for apps that want a centralized
 * server), there is nothing to self-host to try it live. The host — here,
 * the demo — always owns creation and teardown; core only ever receives
 * the provider through `blockKit.collaboration`.
 */
export function createDemoCollaboration(room: string): DemoCollaboration {
  const document = new YDoc();
  const provider = new WebrtcProvider(room, document, { signaling: signalingServers() });

  return {
    document,
    provider,
    user: randomUser(),
    destroy: () => provider.disconnect(),
  };
}
