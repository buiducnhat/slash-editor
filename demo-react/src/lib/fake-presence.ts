import type { PresenceProvider } from "@slash-editor/react";

/**
 * A static, non-networked `PresenceProvider` for the docs page: real
 * presence needs a live Hocuspocus room (see `?collab=<room>` in the
 * playground), which a docs page showing one component in isolation
 * shouldn't have to stand up. `usePresence` only ever reads
 * `awareness.getStates()`/`clientID` and subscribes to `"update"` — a
 * provider that never fires `"update"` is a legal, if static, awareness.
 */
export function createFakePresenceProvider(): PresenceProvider {
  const states = new Map<number, Record<string, unknown>>([
    [2, { user: { name: "Ada Lovelace", color: "#f97316" } }],
    [3, { user: { name: "Grace Hopper", color: "#22c55e" } }],
  ]);

  return {
    awareness: {
      clientID: 1,
      getStates: () => states,
      on: () => {},
      off: () => {},
    },
  };
}
