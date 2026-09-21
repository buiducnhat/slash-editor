import { useCallback, useRef, useSyncExternalStore } from "react";

/** A remote peer's awareness state, keyed by their Yjs client id. */
export interface PresencePeer {
  clientId: number;
  [key: string]: unknown;
}

/**
 * The awareness surface `usePresence` needs from a network provider —
 * structurally identical to `@slash-editor/core`'s `CollaborationProvider`,
 * kept as a separate duck-typed interface so this package never depends on
 * `yjs`/`y-protocols` types directly.
 */
export interface PresenceProvider {
  awareness: {
    clientID: number;
    getStates(): Map<number, Record<string, unknown>>;
    on(event: "update" | "change", listener: () => void): void;
    off(event: "update" | "change", listener: () => void): void;
  };
}

const EMPTY: PresencePeer[] = [];

const noop = () => {};

function statesToPeers(
  states: Map<number, Record<string, unknown>>,
  localClientId: number,
): PresencePeer[] {
  const peers: PresencePeer[] = [];
  states.forEach((state, clientId) => {
    if (clientId === localClientId) {
      return;
    }
    const user = (state.user as Record<string, unknown> | undefined) ?? {};
    peers.push({ ...user, clientId });
  });
  return peers;
}

/**
 * Reads connected peers off a Yjs awareness instance (Hocuspocus,
 * `y-websocket`, `y-webrtc`, …) for chrome outside the editor — an avatar
 * row, an "N online" badge. In-document presence (remote carets and
 * selections) is unrelated: that renders entirely inside
 * `@slash-editor/core`'s `collaboration()`, driven by the same provider.
 *
 * The peer list is cached and only recomputed on a real awareness
 * `"update"` event or a provider change, so repeated `getSnapshot` calls
 * during render return a stable reference.
 */
export function usePresence(provider: PresenceProvider | null | undefined): PresencePeer[] {
  const cache = useRef<{ provider: PresenceProvider | null | undefined; peers: PresencePeer[] }>({
    provider: undefined,
    peers: EMPTY,
  });

  const subscribe = useCallback(
    (listener: () => void) => {
      const awareness = provider?.awareness;
      if (!awareness) {
        return noop;
      }
      const onUpdate = () => {
        cache.current = {
          provider,
          peers: statesToPeers(awareness.getStates(), awareness.clientID),
        };
        listener();
      };
      awareness.on("update", onUpdate);
      return () => awareness.off("update", onUpdate);
    },
    [provider],
  );

  const getSnapshot = useCallback((): PresencePeer[] => {
    const awareness = provider?.awareness;
    if (!awareness) {
      cache.current = { provider, peers: EMPTY };
      return EMPTY;
    }
    if (cache.current.provider !== provider) {
      cache.current = { provider, peers: statesToPeers(awareness.getStates(), awareness.clientID) };
    }
    return cache.current.peers;
  }, [provider]);

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
