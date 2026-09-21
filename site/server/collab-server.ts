import { Hocuspocus } from "@hocuspocus/server";
import crossws from "crossws/adapters/bun";

/**
 * Minimal self-host recipe for `@slash-editor/core`'s `collaboration()`:
 * one in-memory Yjs document per room (the `name` each `HocuspocusProvider`
 * connects with — see `src/lib/collaboration.ts`), no persistence
 * extension. Hocuspocus already handles sync, awareness fan-out, and
 * reconnect; a real deployment only adds `onStoreDocument`/`onLoadDocument`
 * (or an official extension like `@hocuspocus/extension-sqlite`) to survive
 * a restart.
 *
 * `@hocuspocus/server`'s convenience `Server` class assumes Node's
 * `node:http` + crossws's Node adapter, which refuses to run under Bun. The
 * lower-level `Hocuspocus` class is runtime-agnostic — this bridges it to
 * `Bun.serve` with crossws's Bun adapter, the pattern Hocuspocus's own docs
 * give for Bun (https://tiptap.dev/docs/hocuspocus/server/examples#bun).
 *
 * Run with `bun run collab:server` (see `package.json`); the Playwright
 * suite starts it automatically for `tests/e2e/collab.spec.ts`.
 */
const port = Number(process.env.COLLAB_SERVER_PORT ?? 1234);

const hocuspocus = new Hocuspocus({ name: "slash-editor-collab" });

const ws = crossws({
  hooks: {
    open(peer) {
      // `peer.websocket` is a Bun `ServerWebSocket`, proxied in a way that
      // breaks its own `this` binding when methods are torn off — wrap it
      // in a plain object instead of passing the proxy straight through.
      const socket = {
        get readyState() {
          return peer.websocket.readyState ?? 3; // 3 = CLOSED
        },
        send: (data: unknown) => peer.send(data as never),
        close: (code?: number, reason?: string) => peer.close(code, reason),
      };
      const connection = hocuspocus.handleConnection(socket, peer.request as Request);
      Object.assign(peer, { _hocuspocus: connection });
    },
    message(peer, message) {
      (
        peer as { _hocuspocus?: ReturnType<Hocuspocus["handleConnection"]> }
      )._hocuspocus?.handleMessage(message.uint8Array());
    },
    close(peer, event) {
      (
        peer as { _hocuspocus?: ReturnType<Hocuspocus["handleConnection"]> }
      )._hocuspocus?.handleClose({
        code: event.code ?? 1000,
        reason: event.reason ?? "",
      });
    },
    error(peer, error) {
      console.error(`slash-editor collab server: websocket error for peer ${peer.id}`, error);
    },
  },
});

Bun.serve({
  port,
  websocket: ws.websocket,
  fetch(request, server) {
    if (request.headers.get("upgrade") === "websocket") {
      return ws.handleUpgrade(request, server);
    }
    return new Response("slash-editor collab server");
  },
});

console.log(`slash-editor collab server listening on ws://localhost:${port}`);
