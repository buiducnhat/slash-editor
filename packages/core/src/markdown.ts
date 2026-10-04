/*
 * `@slash-editor/core/markdown` — a separate entry so `marked` and
 * `@tiptap/markdown` (~20 KB gzipped) stay out of bundles that never import
 * it. Nodes carry their markdown hooks in the main entry through
 * `markdown-syntax.ts`, which has no dependencies; they only run once this
 * entry's `Markdown` extension or helpers are in play.
 */
import {
  Extension,
  type Extensions,
  flattenExtensions,
  getExtensionField,
  type JSONContent,
  type NodeConfig,
} from "@tiptap/core";
import {
  Markdown as TiptapMarkdown,
  type MarkdownExtensionOptions,
  MarkdownManager,
} from "@tiptap/markdown";
import { Marked, type marked } from "marked";
import { createBlockKit } from "./block-kit.ts";

export type MarkdownOptions = MarkdownExtensionOptions;

type Exclusion = NonNullable<NodeConfig["excludeFromMarkdown"]>;
type ManagerOptions = ConstructorParameters<typeof MarkdownManager>[0] & object;

const SYNTAX_EXTENSION_NAME = "slashMarkdownSyntax";

// One whole `<!-- slash:… -->` comment at the start of a line. A marker
// payload never contains `-->` (see `renderMarker`), so the first one ends it.
const LEADING_MARKER = String.raw`^ {0,3}<!-- \/?slash:(?:(?!-->)[^\n])*-->`;
// A line holding nothing but one marker: how every block marker is written.
// A line with more after its first marker is inline content — a mention or
// page link opening a paragraph — and lexes as such.
const MARKER_LINE = new RegExp(String.raw`${LEADING_MARKER}[ \t]*(?:\n|$)`);
const MARKER_LED = new RegExp(LEADING_MARKER);

/**
 * Catch-all for any `<!-- slash:… -->` marker a node tokenizer declined — a
 * malformed payload, a node missing from this schema, an orphaned column
 * separator. Swallowed, so the block after it still parses as plain markdown
 * instead of the comment surfacing as literal text, which is what
 * `MarkdownManager` does with raw HTML when there is no DOM to parse it.
 *
 * The block catch-all takes only a line holding a single marker. Its `start`
 * still stops a paragraph at every marker-led line; when nothing claims that
 * line as a block, `marked` merges it back into the paragraph it cut.
 *
 * Priority is high so these register with `marked` first: `marked` tries the
 * most recently registered tokenizer first, which leaves the catch-alls last,
 * behind every node's own marker tokenizer.
 */
const MarkdownSyntax = Extension.create({
  name: SYNTAX_EXTENSION_NAME,
  addExtensions() {
    return [
      Extension.create({
        name: "slashMarkdownBlockMarker",
        priority: 10_000,
        markdownTokenizer: {
          name: "slashMarkdownBlockMarker",
          level: "block",
          start: (src) => src.search(/^ {0,3}<!-- \/?slash:/m),
          tokenize: (src) => {
            const match = MARKER_LINE.exec(src);

            return match ? { type: "slashMarkdownBlockMarker", raw: match[0] } : undefined;
          },
        },
      }),
      Extension.create({
        name: "slashMarkdownInlineMarker",
        priority: 10_000,
        markdownTokenizer: {
          name: "slashMarkdownInlineMarker",
          level: "inline",
          start: (src) => src.indexOf("<!-- "),
          tokenize: (src) => {
            const match = /^<!-- \/?slash:[^\n]*?-->/.exec(src);

            return match ? { type: "slashMarkdownInlineMarker", raw: match[0] } : undefined;
          },
        },
      }),
    ];
  },
});

function pruneExcluded(node: JSONContent, exclusions: Map<string, Exclusion>): JSONContent {
  if (!node.content?.length) {
    return node;
  }

  let changed = false;
  const content: JSONContent[] = [];

  for (const child of node.content) {
    if (child.type && exclusions.get(child.type)?.(child)) {
      changed = true;
      continue;
    }

    const pruned = pruneExcluded(child, exclusions);
    changed ||= pruned !== child;
    content.push(pruned);
  }

  if (!changed) {
    return node;
  }

  // A container whose only children were excluded still needs one to stay valid.
  return { ...node, content: content.length ? content : [{ type: "paragraph", content: [] }] };
}

/**
 * `MarkdownManager` with three changes:
 *
 * - its own `marked` instance by default. The upstream default is the global
 *   `marked` singleton, and every manager registers its tokenizers into it —
 *   so each editor would stack another copy, and a host app rendering its own
 *   markdown through `marked` would start parsing `> [!NOTE]` as a callout.
 * - a line led by a slash marker is never an HTML block. CommonMark reads any
 *   line opening with `<!--` as one, which would turn a paragraph that starts
 *   with a mention into literal text; whole-line block markers are claimed by
 *   the node tokenizers and the catch-all before `marked` gets there.
 * - `serialize` drops nodes whose `excludeFromMarkdown` matches.
 */
class SlashMarkdownManager extends MarkdownManager {
  private readonly exclusions = new Map<string, Exclusion>();

  constructor(options: ManagerOptions) {
    super({
      ...options,
      // `MarkdownManager` only touches `Lexer`, `defaults`, `use` and
      // `setOptions`, all of which a `Marked` instance has; the option is just
      // typed as the global function-object.
      marked: options.marked ?? (new Marked() as unknown as typeof marked),
    });

    // `undefined` skips `marked`'s HTML rule, so the line lexes as a paragraph;
    // `false` falls through to it.
    this.instance.use({
      tokenizer: { html: (src) => (MARKER_LED.test(src) ? undefined : false) },
    });

    for (const extension of flattenExtensions(options.extensions)) {
      const exclude = getExtensionField<Exclusion | undefined>(extension, "excludeFromMarkdown");

      if (exclude) {
        this.exclusions.set(extension.name, exclude);
      }
    }
  }

  override serialize(doc: JSONContent): string {
    return super.serialize(pruneExcluded(doc, this.exclusions));
  }
}

/**
 * Tiptap's `Markdown` extension — `editor.getMarkdown()`,
 * `setContent(md, { contentType: "markdown" })`, and the same for
 * `insertContent`/`insertContentAt` — plus the slash-editor syntax every
 * node's markdown hooks rely on, and a `marked` instance per editor instead
 * of the shared global.
 */
export const Markdown = TiptapMarkdown.extend({
  addStorage() {
    return {
      manager: new SlashMarkdownManager({ ...this.options, extensions: [] }),
    };
  },

  // Replaces the parent hook rather than wrapping it: the parent builds its
  // manager on `options.marked` — the global singleton by default.
  onBeforeCreate() {
    const manager = new SlashMarkdownManager({
      ...this.options,
      extensions: this.editor.extensionManager.baseExtensions,
    });
    const { content, contentType } = this.editor.options;

    this.storage.manager = manager;
    this.editor.markdown = manager;
    this.editor.getMarkdown = () => manager.serialize(this.editor.getJSON());

    if (contentType === "markdown" && typeof content === "string") {
      const json = manager.parse(content);

      // Leave an empty result as the empty string, so ProseMirror fills in
      // the document's required block itself.
      if (json.content?.length) {
        this.editor.options.content = json;
      }
    }
  },

  addExtensions() {
    return [MarkdownSyntax];
  },
});

/**
 * Configures markdown import/export. Opt in through the kit's `extend`:
 * `createBlockKit({ extend: [markdown()] })`.
 */
export function markdown(options: Partial<MarkdownOptions> = {}) {
  return Markdown.configure(options);
}

const managers = new WeakMap<Extensions, SlashMarkdownManager>();
let defaultKit: Extensions | undefined;

function managerFor(extensions: Extensions = (defaultKit ??= createBlockKit())) {
  let manager = managers.get(extensions);

  if (!manager) {
    const hasSyntax = flattenExtensions(extensions).some(
      (extension) => extension.name === SYNTAX_EXTENSION_NAME,
    );

    manager = new SlashMarkdownManager({
      extensions: hasSyntax ? extensions : [...extensions, MarkdownSyntax],
    });
    managers.set(extensions, manager);
  }

  return manager;
}

/**
 * Serializes a document to GitHub-flavoured markdown without an editor or a
 * DOM. `extensions` must describe the schema the document was written in —
 * a node with no markdown renderer is left out. Managers are cached per
 * `extensions` array, so pass the same array across calls.
 *
 * @param extensions Defaults to `createBlockKit()`.
 */
export function serializeMarkdown(doc: JSONContent, extensions?: Extensions): string {
  return managerFor(extensions).serialize(doc);
}

/**
 * Parses markdown into a document without an editor or a DOM. The result
 * carries no block ids; `BlockId` assigns them once it is loaded into an
 * editor.
 *
 * @param extensions Defaults to `createBlockKit()`.
 */
export function parseMarkdown(markdown: string, extensions?: Extensions): JSONContent {
  return managerFor(extensions).parse(markdown);
}
