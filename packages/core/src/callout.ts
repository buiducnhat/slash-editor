import { mergeAttributes, Node } from "@tiptap/core";
import { blockChildren, markerStart, readMarker, renderMarker } from "./markdown-syntax.ts";

export interface CalloutOptions {
  /**
   * Emoji shown when a callout is created and no icon attribute is parsed
   * from HTML.
   *
   * @default "💡"
   */
  defaultIcon: string;
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the current block range in a callout. */
      setCallout: () => ReturnType;
      /** Wraps in a callout, or lifts out of one if already inside. */
      toggleCallout: () => ReturnType;
      /** Lifts the current block out of its enclosing callout. */
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * GitHub alert type per icon. Only these five exist, so any other icon rides
 * along in a `slash:callout` marker on a `NOTE` alert.
 */
const ALERT_BY_ICON: Record<string, string> = {
  "💡": "TIP",
  ℹ️: "NOTE",
  "❗": "IMPORTANT",
  "⚠️": "WARNING",
  "⛔": "CAUTION",
};
const ICON_BY_ALERT = Object.fromEntries(
  Object.entries(ALERT_BY_ICON).map(([icon, alert]) => [alert, icon]),
);

// Consecutive `>` lines opening with a bare alert tag; a lazy continuation
// line (no `>`) ends the alert, since the serializer never writes one.
const ALERT =
  /^( {0,3}> ?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$))((?: {0,3}>[^\n]*(?:\n|$))*)/i;
const startMarker = markerStart("callout");

/**
 * A highlighted aside with a leading emoji, wrapping arbitrary block content
 * (`content: block+`) rather than a flat textblock. Nesting follows the
 * container-node approach used across M1: no universal block wrapper.
 */
export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addOptions() {
    return { defaultIcon: "💡", HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      icon: {
        default: this.options.defaultIcon,
        parseHTML: (element) => element.getAttribute("data-icon") ?? this.options.defaultIcon,
        renderHTML: (attributes) => ({ "data-icon": attributes.icon }),
      },
    };
  },
  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      0,
    ];
  },
  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
  // Markdown hooks are called unbound — no `this.options` — so a JSON node
  // missing its icon falls back to the built-in default.
  renderMarkdown(node, h) {
    const icon: string = node.attrs?.icon ?? "💡";
    const alert = ALERT_BY_ICON[icon];
    const body = h.renderChildren(node.content ?? [], "\n\n");
    const quoted = `[!${alert ?? "NOTE"}]\n${body}`
      .split("\n")
      .map((line) => (line ? `> ${line}` : ">"))
      .join("\n");

    return alert ? quoted : `${renderMarker("callout", { icon })}\n${quoted}`;
  },
  markdownTokenizer: {
    name: "callout",
    level: "block",
    start: (src) => {
      const indexes = [startMarker(src), src.search(/^ {0,3}> ?\[!/m)].filter((i) => i >= 0);

      return indexes.length ? Math.min(...indexes) : -1;
    },
    tokenize(src, _tokens, lexer) {
      const marker = readMarker(src, "callout");
      const rest = marker ? src.slice(marker.raw.length) : src;
      const match = ALERT.exec(rest);

      if (!match) {
        return undefined;
      }

      const body = match[3]!.replace(/^ {0,3}> ?/gm, "");
      const icon = marker?.attrs.icon;

      return {
        type: "callout",
        raw: (marker?.raw ?? "") + match[0],
        icon: typeof icon === "string" ? icon : ICON_BY_ALERT[match[2]!.toUpperCase()],
        tokens: lexer.blockTokens(body),
      };
    },
  },
  parseMarkdown: (token, h) =>
    h.createNode("callout", { icon: token.icon }, blockChildren(token.tokens ?? [], h)),
});

/** Configures the callout node. */
export function callout(options: Partial<CalloutOptions> = {}) {
  return Callout.configure(options);
}
