import { experimental_upgradeWebSocket } from "@vercel/functions";
import type { WebSocket } from "ws";

/**
 * A `y-webrtc` signaling relay, running as a Vercel Function on Fluid
 * Compute — a faithful port of `y-webrtc`'s own `bin/server.js` protocol
 * (subscribe/unsubscribe/publish/ping-pong over JSON messages), adapted
 * from the `ws` package's server API to `@vercel/functions`'s WebSocket
 * upgrade. It relays only WebRTC connection setup (SDP/ICE) between
 * peers in the same room — no document content, no persistence, and it
 * holds no state once every peer in a topic disconnects.
 *
 * Caveat: a WebSocket connection is pinned to one Function instance, and
 * two different connections aren't guaranteed to land on the same one
 * (https://vercel.com/docs/functions/websockets#manage-persistent-state).
 * This in-memory `topics` map is therefore correct only when all of a
 * room's peers happen to reach the same warm instance — true for this
 * demo's traffic today. If peers start missing each other under load,
 * the fix is a shared pub/sub layer (e.g. Redis) behind the same
 * subscribe/publish protocol, not a different protocol.
 */
const PING_TIMEOUT_MS = 30_000;

const topics = new Map<string, Set<WebSocket>>();

interface SignalingMessage {
  type?: "subscribe" | "unsubscribe" | "publish" | "ping" | "pong";
  topics?: unknown;
  topic?: unknown;
  clients?: number;
  [key: string]: unknown;
}

function rawDataToString(raw: WebSocket.RawData): string {
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf-8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf-8");
  return raw.toString("utf-8");
}

function send(conn: WebSocket, message: SignalingMessage): void {
  if (conn.readyState !== conn.CONNECTING && conn.readyState !== conn.OPEN) {
    conn.close();
    return;
  }
  try {
    conn.send(JSON.stringify(message));
  } catch {
    conn.close();
  }
}

export async function GET(): Promise<Response> {
  return experimental_upgradeWebSocket((ws) => {
    const subscribedTopics = new Set<string>();
    let closed = false;
    let pongReceived = true;

    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        ws.close();
        clearInterval(pingInterval);
        return;
      }
      pongReceived = false;
      try {
        ws.ping();
      } catch {
        ws.close();
      }
    }, PING_TIMEOUT_MS);

    ws.on("pong", () => {
      pongReceived = true;
    });

    ws.on("close", () => {
      closed = true;
      clearInterval(pingInterval);
      for (const topicName of subscribedTopics) {
        const subs = topics.get(topicName);
        subs?.delete(ws);
        if (subs && subs.size === 0) {
          topics.delete(topicName);
        }
      }
      subscribedTopics.clear();
    });

    ws.on("message", (raw) => {
      if (closed) return;

      let message: SignalingMessage;
      try {
        message = JSON.parse(rawDataToString(raw));
      } catch {
        return;
      }
      if (!message.type) return;

      switch (message.type) {
        case "subscribe": {
          const requested = Array.isArray(message.topics) ? message.topics : [];
          for (const topicName of requested) {
            if (typeof topicName !== "string") continue;
            let subs = topics.get(topicName);
            if (!subs) {
              subs = new Set();
              topics.set(topicName, subs);
            }
            subs.add(ws);
            subscribedTopics.add(topicName);
          }
          break;
        }
        case "unsubscribe": {
          const requested = Array.isArray(message.topics) ? message.topics : [];
          for (const topicName of requested) {
            if (typeof topicName === "string") topics.get(topicName)?.delete(ws);
          }
          break;
        }
        case "publish": {
          if (typeof message.topic === "string") {
            const receivers = topics.get(message.topic);
            if (receivers) {
              message.clients = receivers.size;
              for (const receiver of receivers) send(receiver, message);
            }
          }
          break;
        }
        case "ping":
          send(ws, { type: "pong" });
          break;
      }
    });
  });
}
