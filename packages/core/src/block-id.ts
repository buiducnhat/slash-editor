import type { GlobalAttributes, Mark, Node, Range } from "@tiptap/core";
import {
  callOrReturn,
  combineTransactionSteps,
  Extension,
  findChildrenInRange,
  getChangedRanges,
  getExtensionField,
} from "@tiptap/core";
import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";

export interface BlockIdOptions {
  /**
   * Node type names that receive an id, or `"auto"` to derive them from
   * every registered extension whose resolved `group` or `content`
   * expression contains `block`. Mirrors how `getSchemaByResolvedExtensions`
   * resolves those fields, so function-valued extensions resolve the same
   * way here as they do in the schema.
   *
   * @default "auto"
   */
  types: string[] | "auto";
  /** Node type names excluded from an `"auto"` derivation. */
  exclude: string[];
}
export const blockIdPluginKey = new PluginKey<null>("blockId");

/**
 * Transactions carrying this meta flag are skipped by the assignment pass.
 * A future collaboration provider sets it on transactions that apply a
 * remote change, keeping ids deterministic across peers.
 */
export const BLOCK_ID_REMOTE_META = "blockId:remote";

/**
 * y-prosemirror stores its sync plugin's meta under this literal string: a
 * `PluginKey("y-sync")` resolves to `"y-sync$"` the first time one is
 * constructed. Checking the string lets remote Yjs transactions be
 * recognized without depending on `@tiptap/y-tiptap`/`y-prosemirror` at M1.
 */
const Y_SYNC_META_KEY = "y-sync$";

const ID_LENGTH = 12;
const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

/** 12 chars from a 64-symbol alphabet: ~72 bits, collision-safe without a registry check. */
function generateBlockId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = "";

  for (const byte of bytes) {
    id += ID_ALPHABET[byte % ID_ALPHABET.length];
  }

  return id;
}

function isBlockExpression(value: unknown): boolean {
  return typeof value === "string" && /\bblock\b/.test(value);
}

/**
 * Node types eligible for a block id: `group` membership in `block`, or a
 * `content` expression that requires block children (list items, future
 * `details`/`callout`). Depth is irrelevant — a paragraph inside a list item
 * gets its own id alongside the list item's, since comment anchoring and
 * block permissions (M4) need identity at every level, not just drag units.
 */
function deriveBlockTypes(extensions: (Node | Mark)[], exclude: string[]): string[] {
  const types: string[] = [];

  for (const extension of extensions) {
    if (extension.type !== "node" || exclude.includes(extension.name)) {
      continue;
    }

    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };

    // The document root has block content but is never itself an addressable block.
    if (callOrReturn(getExtensionField(extension, "topNode", context))) {
      continue;
    }

    const group = callOrReturn(getExtensionField(extension, "group", context));
    const content = callOrReturn(getExtensionField(extension, "content", context));

    if (isBlockExpression(group) || isBlockExpression(content)) {
      types.push(extension.name);
    }
  }

  return types;
}

/** Counts live ids per type set, so a pasted duplicate can be told apart from the original it was copied from. */
function collectIdCounts(doc: ProseMirrorNode, types: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();

  doc.descendants((node) => {
    if (types.has(node.type.name) && typeof node.attrs.id === "string") {
      counts.set(node.attrs.id, (counts.get(node.attrs.id) ?? 0) + 1);
    }
  });

  return counts;
}

/** Node types carrying an `id` attribute in the live schema — the set `addGlobalAttributes` produced. */
function blockIdTypes(schema: Schema): Set<string> {
  const types = new Set<string>();

  for (const [name, type] of Object.entries(schema.nodes)) {
    if (type.spec.attrs && "id" in type.spec.attrs) {
      types.add(name);
    }
  }

  return types;
}

/**
 * Assigns a fresh id to every node in `ranges` that has none, or whose id is
 * shared with another node in the document. Attribute-only changes never
 * move content, so positions collected up front stay valid for the whole
 * pass without remapping.
 */
function assignBlockIds(
  tr: Transaction,
  ranges: readonly Range[],
  types: Set<string>,
  counts: Map<string, number>,
): boolean {
  let changed = false;

  for (const range of ranges) {
    for (const { node, pos } of findChildrenInRange(tr.doc, range, (candidate) =>
      types.has(candidate.type.name),
    )) {
      const id = node.attrs.id;
      const needsId = typeof id !== "string" || (counts.get(id) ?? 0) > 1;

      if (!needsId) {
        continue;
      }

      if (typeof id === "string") {
        counts.set(id, (counts.get(id) ?? 1) - 1);
      }

      const nextId = generateBlockId();
      counts.set(nextId, 1);
      tr.setNodeAttribute(pos, "id", nextId);
      changed = true;
    }
  }

  return changed;
}

/**
 * Injects a stable `attrs.id` into every block-capable node and renders it
 * as `data-block-id`, alongside a constant `data-block-type` per node type
 * for the styling seam. Ids are assigned on insert/parse only, never
 * regenerated on attribute update or remote change — the invariant the
 * eventual Yjs identity (M4) depends on.
 */
export const BlockId = Extension.create<BlockIdOptions>({
  name: "blockId",

  addOptions() {
    return {
      types: "auto",
      exclude: [],
    };
  },

  addGlobalAttributes() {
    const types =
      this.options.types === "auto"
        ? deriveBlockTypes(this.extensions, this.options.exclude)
        : this.options.types;

    const attributes: GlobalAttributes = types.map((type) => ({
      types: [type],
      attributes: {
        id: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-block-id"),
          renderHTML: (attrs) => ({
            "data-block-type": type,
            ...(typeof attrs.id === "string" ? { "data-block-id": attrs.id } : {}),
          }),
        },
      },
    }));

    return attributes;
  },

  onCreate() {
    const { editor } = this;
    const types = blockIdTypes(editor.schema);
    const tr = editor.state.tr;
    const counts = collectIdCounts(tr.doc, types);
    const range: Range = { from: 0, to: tr.doc.content.size };

    if (assignBlockIds(tr, [range], types, counts)) {
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    }
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: blockIdPluginKey,
        appendTransaction: (transactions, oldState, newState) => {
          if (
            transactions.some(
              (tr) => tr.getMeta(BLOCK_ID_REMOTE_META) || tr.getMeta(Y_SYNC_META_KEY),
            )
          ) {
            return null;
          }

          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const types = blockIdTypes(editor.schema);
          const tr = newState.tr;
          const counts = collectIdCounts(tr.doc, types);
          const ranges = getChangedRanges(
            combineTransactionSteps(oldState.doc, [...transactions]),
          ).map((change) => change.newRange);

          return assignBlockIds(tr, ranges, types, counts) ? tr : null;
        },
      }),
    ];
  },
});

/** Configures the block id extension. */
export function blockId(options: Partial<BlockIdOptions> = {}) {
  return BlockId.configure(options);
}
