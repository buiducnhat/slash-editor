import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc as YDoc } from "yjs";

const DEFAULT_COLLAB_SERVER_URL = "ws://localhost:1234";

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
  /** Non-null: `createDemoCollaboration` never disables awareness. */
  provider: HocuspocusProvider & { awareness: NonNullable<HocuspocusProvider["awareness"]> };
  user: { name: string; color: string };
  destroy: () => void;
}

/**
 * Wires a shared `Y.Doc` and a `HocuspocusProvider` for `room` against the
 * self-host recipe in `server/collab-server.ts`. The host — here, the demo
 * — always owns creation, persistence, and teardown of both; core only
 * ever receives them through `blockKit.collaboration`.
 */
export function createDemoCollaboration(room: string): DemoCollaboration {
  const document = new YDoc();
  const provider = new HocuspocusProvider({
    url: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL ?? DEFAULT_COLLAB_SERVER_URL,
    name: room,
    document,
  });
  if (!provider.awareness) {
    throw new Error("HocuspocusProvider was created without awareness support");
  }

  return {
    document,
    provider: provider as DemoCollaboration["provider"],
    user: randomUser(),
    destroy: () => provider.destroy(),
  };
}
