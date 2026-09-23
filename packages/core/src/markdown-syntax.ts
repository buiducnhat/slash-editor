import type { JSONContent, MarkdownToken, NodeConfig } from "@tiptap/core";

/*
 * Dependency-free helpers the node modules share for their markdown hooks.
 * Kept apart from `markdown.ts` so a node declaring `renderMarkdown` never
 * pulls `@tiptap/markdown`/`marked` into a bundle that does not opt in.
 */

declare module "@tiptap/core" {
  interface NodeConfig<Options, Storage> {
    /**
     * Leaves a node out of markdown export entirely. For transient state with
     * no durable content — a streaming AI draft, an upload still in flight —
     * whose rendering would re-import as something the user never wrote. An
     * excluded node leaves no blank-line residue, which a renderer returning
     * `""` would (the parent's separator still lands, and re-imports as an
     * empty paragraph).
     */
    excludeFromMarkdown?: (node: JSONContent) => boolean;
  }
}

export type MarkerAttrs = Record<string, unknown>;

/** Line end after a block construct: trailing spaces, then a newline or the end of input. */
const LINE_END = String.raw`[ \t]*(?:\n|$)`;
// A marker payload never contains `-->` (see `renderMarker`), so the first
// `} -->` is the real end of the comment.
const PAYLOAD = String.raw`(?: (\{.*?\}))?`;

/**
 * `<!-- slash:<type> {json} -->`. `--` never occurs outside a JSON string and
 * `\u002d` is a valid escape inside one, so rewriting it is all it takes to
 * keep an attribute value from closing the comment early. Nullish attributes
 * are omitted; with none left, so is the payload.
 *
 * @internal
 */
export function renderMarker(type: string, attrs: MarkerAttrs = {}): string {
  const defined = Object.entries(attrs).filter(([, value]) => value != null);
  const payload = defined.length
    ? ` ${JSON.stringify(Object.fromEntries(defined)).replaceAll("--", "\\u002d\\u002d")}`
    : "";

  return `<!-- slash:${type}${payload} -->`;
}

/** @internal A marker's closing twin: `<!-- /slash:<type> -->`. */
export function renderClosingMarker(type: string): string {
  return `<!-- /slash:${type} -->`;
}

function markerPattern(type: string, closing = false): string {
  return String.raw` {0,3}<!-- ${closing ? "/" : ""}slash:${type}${closing ? "" : PAYLOAD} -->`;
}

function parsePayload(payload: string | undefined): MarkerAttrs | undefined {
  if (payload === undefined) {
    return {};
  }

  try {
    const value: unknown = JSON.parse(payload);

    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as MarkerAttrs)
      : undefined;
  } catch {
    return undefined;
  }
}

const markerRegexes = new Map<string, RegExp>();

/**
 * Reads a `type` marker at the very start of `src` — through the end of its
 * line unless `inline`. `undefined` when there is none or its payload is
 * malformed: the caller then declines, and the catch-all marker tokenizer in
 * `markdown.ts` swallows the marker so what follows still parses as plain
 * markdown.
 *
 * @internal
 */
export function readMarker(
  src: string,
  type: string,
  inline = false,
): { raw: string; attrs: MarkerAttrs } | undefined {
  const key = `${type}${inline ? ":inline" : ""}`;
  let regex = markerRegexes.get(key);

  if (!regex) {
    regex = new RegExp(`^${markerPattern(type)}${inline ? "" : LINE_END}`);
    markerRegexes.set(key, regex);
  }

  const match = regex.exec(src);
  const attrs = match ? parsePayload(match[1]) : undefined;

  return match && attrs ? { raw: match[0], attrs } : undefined;
}

/**
 * `start` hint for a marker-led block: the first line opening with a `type`
 * marker, so a paragraph running into one stops there.
 *
 * @internal
 */
export function markerStart(type: string): (src: string) => number {
  const pattern = new RegExp(`^ {0,3}<!-- slash:${type}[ >]`, "m");

  return (src) => src.search(pattern);
}

/** @internal Keeps only `keys` of a parsed marker payload, dropping anything unexpected. */
export function pickAttrs(attrs: MarkerAttrs, keys: readonly string[]): MarkerAttrs {
  return Object.fromEntries(keys.filter((key) => key in attrs).map((key) => [key, attrs[key]]));
}

/**
 * One whole-line `[label](href)` (or `![alt](src)`). Angle-bracket
 * destinations keep an href with spaces or parentheses byte-for-byte, where
 * percent-encoding it would change the stored URL on re-import.
 *
 * @internal
 */
export function renderLinkLine(label: string, href: string, image = false): string {
  const text = label.replace(/[\\[\]]/g, "\\$&");
  const destination = /[\s()<>]/.test(href)
    ? `<${href.replace(/[<>]/g, encodeURIComponent)}>`
    : href;

  return `${image ? "!" : ""}[${text}](${destination})`;
}

const LINK_LINE = new RegExp(
  String.raw`^ {0,3}(!?)\[((?:\\.|[^\\\]\n])*)\]\((?:<([^<>\n]*)>|([^\s()<>]*))(?:[ \t]+"(?:\\.|[^"\\\n])*")?\)` +
    LINE_END,
);

/** @internal Reads one whole-line link or image at the start of `src`. */
export function readLinkLine(
  src: string,
): { raw: string; image: boolean; label: string; href: string } | undefined {
  const match = LINK_LINE.exec(src);

  if (!match) {
    return undefined;
  }

  return {
    raw: match[0],
    image: match[1] === "!",
    label: match[2]!.replace(/\\(.)/g, "$1"),
    href: match[3] ?? match[4] ?? "",
  };
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * One part's content without the blank line the serializer writes on each
 * side of a structural line. Anything beyond that one is content — a blank
 * line more is how a trailing empty paragraph is spelled — so this strips
 * exactly one, not all.
 */
function unpad(part: string): string {
  return part.replace(/^[ \t]*\n/, "").replace(/\n[ \t]*\n$/, "\n");
}

/**
 * Walks `src` line by line to the `close` line that balances an
 * already-consumed opener, counting nested `open` lines and splitting at
 * depth-0 `separator` lines. Lines inside fenced code never count, so a
 * literal `</details>` in a code sample cannot end a toggle. `undefined` when
 * the construct never closes — the caller declines and the text stays literal.
 *
 * @internal
 */
export function scanBlock(
  src: string,
  syntax: { open: RegExp; close: RegExp; separator?: RegExp },
): { length: number; parts: string[] } | undefined {
  const parts: string[] = [];
  let depth = 0;
  let fence: string | null = null;
  let partStart = 0;
  let offset = 0;

  while (offset < src.length) {
    const newline = src.indexOf("\n", offset);
    const end = newline === -1 ? src.length : newline + 1;
    const line = src.slice(offset, newline === -1 ? src.length : newline);

    if (fence) {
      if (line.trim().startsWith(fence)) {
        fence = null;
      }
    } else if (FENCE.test(line)) {
      fence = FENCE.exec(line)![1]!;
    } else if (syntax.open.test(line)) {
      depth += 1;
    } else if (syntax.close.test(line)) {
      if (depth === 0) {
        parts.push(unpad(src.slice(partStart, offset)));

        return { length: end, parts };
      }

      depth -= 1;
    } else if (depth === 0 && syntax.separator?.test(line)) {
      parts.push(unpad(src.slice(partStart, offset)));
      partStart = end;
    }

    offset = end;
  }

  return undefined;
}

/** @internal `^` + a marker line of `type`, for `scanBlock` open/close/separator patterns. */
export function markerLinePattern(type: string, closing = false): RegExp {
  return new RegExp(`^${markerPattern(type, closing)}[ \\t]*$`);
}

/**
 * Block children of a container token, never empty: `content: "block+"`
 * containers need at least one child, and an empty body in markdown is the
 * natural spelling of "one empty paragraph".
 *
 * @internal
 */
export function blockChildren(
  tokens: MarkdownToken[],
  helpers: {
    parseChildren: (tokens: MarkdownToken[]) => JSONContent[];
    parseBlockChildren?: (tokens: MarkdownToken[]) => JSONContent[];
  },
): JSONContent[] {
  const content = (helpers.parseBlockChildren ?? helpers.parseChildren)(tokens);

  return content.length ? content : [{ type: "paragraph", content: [] }];
}

/**
 * Markdown hooks shared by the atom media blocks: a `slash:<type>` marker
 * carrying `markerKeys`, then one `[label](href)` line (`![alt](src)` for an
 * image). An image's marker is only written when there is something to carry,
 * so a plain `![alt](src)` paragraph from any other editor imports as an
 * image; the others always write one, since a bare link has to stay a link.
 * A placeholder or an upload that has not landed has no URL to write and is
 * left out.
 *
 * @internal
 */
export function mediaMarkdown(spec: {
  type: string;
  hrefAttr: string;
  labelAttr?: string;
  markerKeys: readonly string[];
  image?: boolean;
}): Pick<
  NodeConfig,
  "excludeFromMarkdown" | "renderMarkdown" | "markdownTokenizer" | "parseMarkdown"
> {
  const { type, hrefAttr, labelAttr, markerKeys, image = false } = spec;

  return {
    excludeFromMarkdown: (node) =>
      !node.attrs?.[hrefAttr] || (node.attrs.status ?? "ready") !== "ready",

    renderMarkdown: (node) => {
      const attrs = node.attrs ?? {};
      const href: string = attrs[hrefAttr];
      const carried = pickAttrs(attrs, markerKeys);
      const marker =
        image && Object.values(carried).every((value) => value == null)
          ? ""
          : `${renderMarker(type, carried)}\n`;
      const label: string = (labelAttr && attrs[labelAttr]) || (image ? "" : href);

      return marker + renderLinkLine(label, href, image);
    },

    markdownTokenizer: {
      name: type,
      level: "block",
      start: markerStart(type),
      tokenize(src) {
        const marker = readMarker(src, type);

        if (!marker && !image) {
          return undefined;
        }

        const link = readLinkLine(src.slice(marker?.raw.length ?? 0));
        const raw = (marker?.raw ?? "") + (link?.raw ?? "");

        // The line must stand alone: text continuing it on the next line
        // makes it part of a paragraph, where it stays an ordinary link.
        if (!link || link.image !== image || !/^[ \t]*(?:\n|$)/.test(src.slice(raw.length))) {
          return undefined;
        }

        return {
          type,
          raw,
          block: true,
          attrs: marker?.attrs ?? {},
          label: link.label,
          href: link.href,
        };
      },
    },

    parseMarkdown: (token, h) => {
      // `image` is also the token `marked` emits for `![alt](src)` inside
      // running text. A block can't sit there, so it keeps its alt text only:
      // a link mark would collide with the one a badge's `[![alt](src)](href)`
      // wrapper already applies, and two links on one text node is invalid.
      if (!token.block) {
        return { type: "text", text: token.text || token.href || "" };
      }

      const label: string = token.label;

      return h.createNode(type, {
        ...pickAttrs(token.attrs, markerKeys),
        [hrefAttr]: token.href,
        ...(labelAttr ? { [labelAttr]: label && label !== token.href ? label : null } : {}),
      });
    },
  };
}
