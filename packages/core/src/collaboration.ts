import type { Extensions } from "@tiptap/core";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import type { DecorationAttrs } from "@tiptap/pm/view";
import type { Doc as YDoc } from "yjs";

/** Local user attributes broadcast to every connected peer's awareness state. */
export interface CollaborationUser {
  name: string;
  /** Hex color (`#RRGGBB`); an invalid value renders as `transparent`. */
  color: string;
  [key: string]: unknown;
}

/**
 * The awareness surface `collaboration()` needs from a network provider.
 * `HocuspocusProvider`, `y-websocket`'s `WebsocketProvider`, and `y-webrtc`'s
 * `WebrtcProvider` all satisfy this shape without a direct dependency on any
 * one of them — the host picks the transport, core only touches awareness.
 */
export interface CollaborationProvider {
  awareness: {
    setLocalStateField(field: string, value: unknown): void;
    getStates(): Map<number, Record<string, unknown>>;
    on(event: "update" | "change", listener: () => void): void;
    off(event: "update" | "change", listener: () => void): void;
  };
}

export interface CollaborationOptions {
  /** Shared Yjs document. The host owns its lifecycle: creation, persistence, provider wiring. */
  document: YDoc;
  /**
   * Name of the Yjs XML fragment within `document` this editor instance
   * syncs. Change it to sync more than one editor off the same document.
   *
   * @default "content"
   */
  field?: string;
  /**
   * Network/awareness provider. Enables presence carets via
   * `CollaborationCaret`; omit to sync the document with no presence UI
   * (e.g. an offline-first `IndexeddbPersistence`-only setup).
   */
  provider?: CollaborationProvider;
  /**
   * Local user's presence attributes. Only meaningful with `provider` set.
   *
   * @default { name: "Anonymous", color: "#94A3B8" }
   */
  user?: CollaborationUser;
}

const DEFAULT_USER: CollaborationUser = { name: "Anonymous", color: "#94A3B8" };

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Renders a remote caret as `data-*` attributes rather than the upstream
 * extension's default `collaboration-carets__*` class names, matching this
 * project's rule that core emits no class names — the demo styles carets
 * through `.slash-content` like every other node.
 */
function buildCaret(user: Record<string, unknown>): HTMLElement {
  const color = isHexColor(user.color) ? user.color : "transparent";
  const name = typeof user.name === "string" && user.name.length > 0 ? user.name : "Anonymous";

  const caret = document.createElement("span");
  caret.setAttribute("data-collab-caret", "");
  caret.style.borderColor = color;

  const label = document.createElement("span");
  label.setAttribute("data-collab-caret-label", "");
  label.style.backgroundColor = color;
  label.textContent = name;

  caret.append(label);
  return caret;
}

function buildSelection(user: Record<string, unknown>): DecorationAttrs {
  if (!isHexColor(user.color)) {
    return {};
  }
  return {
    nodeName: "span",
    "data-collab-selection": "",
    style: `background-color: ${user.color}33`,
  };
}

/**
 * Wires a shared Yjs document into the editor via Tiptap's official
 * `Collaboration`/`CollaborationCaret` extensions (themselves a thin layer
 * over `y-prosemirror`). `BlockId`'s remote-skip check already recognizes
 * the `"y-sync$"` transaction meta these extensions set, so ids stay
 * deterministic across peers with no further wiring.
 *
 * Callers must disable local undo/redo (`createBlockKit`'s `history:
 * false`): Yjs owns the undo stack once a document is shared, and running
 * both corrupts it.
 */
export function collaboration(options: CollaborationOptions): Extensions {
  const { document, field = "content", provider, user } = options;

  return [
    Collaboration.configure({ document, field }),
    ...(provider
      ? [
          CollaborationCaret.configure({
            provider,
            user: user ?? DEFAULT_USER,
            render: buildCaret,
            selectionRender: buildSelection,
          }),
        ]
      : []),
  ];
}
