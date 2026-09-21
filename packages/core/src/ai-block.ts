import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { findNodeById } from "./upload.ts";
import type { SlashItem } from "./slash-items.ts";

/** Lifecycle of a transient `aiBlock` node. */
export type AiActionStatus = "streaming" | "done" | "error";

export interface StreamContext {
  /** Aborted when the request is superseded by a retry or the block is discarded. */
  signal: AbortSignal;
}

export interface AiRequest {
  /** Slash action id that triggered this request, e.g. `"continue-writing"`. */
  action: string;
  /** Instruction sent to the model. */
  prompt: string;
  /** Plain-text context the instruction operates on. */
  context: string;
}

/**
 * Bring-your-own AI backend. `stream` yields incremental text chunks — core
 * has no opinion on the wire format (SSE, `fetch` streaming, WebSocket),
 * only on the async-iterable contract, so a real deployment can proxy any
 * provider behind one endpoint and the demo can swap in a mock for tests.
 */
export interface StreamAdapter {
  stream(request: AiRequest, context: StreamContext): AsyncIterable<string>;
}

interface PendingEntry {
  request: AiRequest;
  adapter: StreamAdapter;
  controller: AbortController;
}

/**
 * Per-node registry of in-flight/completed AI requests, keyed by the node's
 * `id`. Unlike `PendingUploadRegistry`, entries are kept on success too —
 * "try again" always needs the last request/adapter to replay — and are
 * only dropped (aborting anything still in flight) when the block is
 * discarded or its streamed text is accepted into the document.
 */
export class PendingAiRegistry {
  private readonly pending = new Map<string, PendingEntry>();

  set(id: string, entry: PendingEntry): void {
    this.pending.get(id)?.controller.abort();
    this.pending.set(id, entry);
  }

  get(id: string): PendingEntry | undefined {
    return this.pending.get(id);
  }

  delete(id: string): void {
    this.pending.get(id)?.controller.abort();
    this.pending.delete(id);
  }
}

function applyAiAttrs(editor: Editor, id: string, patch: Record<string, unknown>): void {
  const location = findNodeById(editor.state.doc, id);
  if (!location || location.node.type.name !== AiBlock.name) {
    return;
  }
  const tr = editor.state.tr
    .setNodeMarkup(location.pos, undefined, { ...location.node.attrs, ...patch })
    .setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

/** Starts (or restarts) a stream for a node already present in the document. */
function runAiStream(
  editor: Editor,
  id: string,
  request: AiRequest,
  adapter: StreamAdapter,
  pending: PendingAiRegistry,
): void {
  const controller = new AbortController();
  pending.set(id, { request, adapter, controller });

  void (async () => {
    try {
      let text = "";
      for await (const chunk of adapter.stream(request, { signal: controller.signal })) {
        if (controller.signal.aborted) {
          return;
        }
        text += chunk;
        applyAiAttrs(editor, id, {
          text,
          status: "streaming" satisfies AiActionStatus,
          error: null,
        });
      }
      if (controller.signal.aborted) {
        return;
      }
      applyAiAttrs(editor, id, { status: "done" satisfies AiActionStatus });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      applyAiAttrs(editor, id, {
        status: "error" satisfies AiActionStatus,
        error: error instanceof Error ? error.message : "AI request failed",
      });
    }
  })();
}

export interface RunAiActionOptions {
  action: string;
  prompt: string;
  context: string;
  adapter: StreamAdapter;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiBlock: {
      /** Inserts a transient AI block and starts streaming through `adapter`. */
      runAiAction: (options: RunAiActionOptions) => ReturnType;
      /** Re-runs the last request for the node with this id, from scratch. */
      retryAiAction: (id: string) => ReturnType;
      /** Replaces the transient node with real paragraph(s) built from its streamed text. */
      acceptAiAction: (id: string) => ReturnType;
      /** Removes the transient node without applying anything. */
      discardAiAction: (id: string) => ReturnType;
    };
  }
}

export interface AiBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface AiBlockStorage {
  pending: PendingAiRegistry;
}

/**
 * A transient block that streams an AI response into the document: never
 * meant to be the doc's final shape, only a staging area. `status`/`text`/
 * `error` live in node attrs (part of the doc) so streaming re-renders
 * through the normal transaction pipeline, the same reasoning `Image`
 * documents for upload progress — until the user accepts (replaced by real
 * paragraphs) or discards (removed) it.
 */
export const AiBlock = Node.create<AiBlockOptions, AiBlockStorage>({
  name: "aiBlock",
  group: "block",
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addStorage() {
    return { pending: new PendingAiRegistry() };
  },

  addAttributes() {
    return {
      action: { default: "" },
      prompt: { default: "" },
      text: { default: "" },
      status: {
        default: "streaming",
        parseHTML: (element) => element.getAttribute("data-status") ?? "streaming",
        renderHTML: (attributes) => ({ "data-status": attributes.status }),
      },
      error: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-error"),
        renderHTML: (attributes) => (attributes.error ? { "data-error": attributes.error } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      (node.attrs.text as string | null) || "",
    ];
  },

  addCommands() {
    return {
      runAiAction:
        (options: RunAiActionOptions) =>
        ({ commands, dispatch }) => {
          const id = crypto.randomUUID();
          const request: AiRequest = {
            action: options.action,
            prompt: options.prompt,
            context: options.context,
          };
          const inserted = commands.insertContent({
            type: this.name,
            attrs: {
              id,
              action: request.action,
              prompt: request.prompt,
              text: "",
              status: "streaming",
              error: null,
            },
          });
          if (inserted && dispatch) {
            // Deferred: streaming dispatches its own transactions, which
            // would collide with the transaction Tiptap's command pipeline
            // is still assembling for this very call if done synchronously.
            queueMicrotask(() => {
              runAiStream(this.editor, id, request, options.adapter, this.storage.pending);
            });
          }
          return inserted;
        },
      retryAiAction:
        (id: string) =>
        ({ state, dispatch }) => {
          const entry = this.storage.pending.get(id);
          const location = findNodeById(state.doc, id);
          if (!entry || !location || location.node.type.name !== this.name) {
            return false;
          }
          if (dispatch) {
            // Deferred, both the reset and the restart: a synchronous
            // out-of-band dispatch here would collide with the transaction
            // Tiptap's command pipeline is still assembling for this very
            // call (the same reasoning `retryUpload`'s caller documents).
            queueMicrotask(() => {
              applyAiAttrs(this.editor, id, { text: "", status: "streaming", error: null });
              runAiStream(this.editor, id, entry.request, entry.adapter, this.storage.pending);
            });
          }
          return true;
        },
      acceptAiAction:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          const location = findNodeById(state.doc, id);
          if (!location || location.node.type.name !== this.name) {
            return false;
          }
          if (dispatch) {
            const text = (location.node.attrs.text as string | null) ?? "";
            const paragraphNode = state.schema.nodes.paragraph;
            const lines = text
              .split(/\n{2,}/)
              .map((line) => line.trim())
              .filter(Boolean);
            const nodes =
              paragraphNode &&
              (lines.length > 0
                ? lines.map((line) => paragraphNode.create(null, state.schema.text(line)))
                : [paragraphNode.create()]);
            tr.replaceWith(
              location.pos,
              location.pos + location.node.nodeSize,
              nodes ? Fragment.fromArray(nodes) : Fragment.empty,
            );
          }
          this.storage.pending.delete(id);
          return true;
        },
      discardAiAction:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          const location = findNodeById(state.doc, id);
          if (!location || location.node.type.name !== this.name) {
            return false;
          }
          if (dispatch) {
            tr.delete(location.pos, location.pos + location.node.nodeSize);
          }
          this.storage.pending.delete(id);
          return true;
        },
    };
  },
});

/** Configures the AI block node. */
export function aiBlock(options: Partial<AiBlockOptions> = {}) {
  return AiBlock.configure(options);
}

export interface AiSlashAction {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  /** Instruction sent to the model. */
  prompt: string;
}

const MAX_CONTEXT_LENGTH = 4000;

export const defaultAiSlashActions: AiSlashAction[] = [
  {
    id: "continue-writing",
    title: "Continue writing",
    description: "AI extends the text above the cursor",
    icon: "pencil-sparkles",
    prompt:
      "Continue writing the document naturally, matching its tone and style. Write only the continuation, with no preamble.",
  },
  {
    id: "summarize",
    title: "Summarize",
    description: "AI summarizes the text above the cursor",
    icon: "broom-sparkles",
    prompt: "Summarize the following text in a few concise sentences.",
  },
  {
    id: "brainstorm-ideas",
    title: "Brainstorm ideas",
    description: "AI lists ideas related to the text above the cursor",
    icon: "brain",
    prompt: "Brainstorm a short bullet list of ideas related to the following text.",
  },
  {
    id: "fix-spelling-grammar",
    title: "Fix spelling & grammar",
    description: "AI rewrites the text above the cursor, correcting mistakes",
    icon: "spell-check",
    prompt:
      "Rewrite the following text, correcting spelling and grammar mistakes only, and preserve its meaning and tone.",
  },
];

export interface AiKitOptions {
  adapter: StreamAdapter;
  /** @default defaultAiSlashActions */
  actions: AiSlashAction[];
  /** Opts out of registering the built-in `aiBlock` node — for a host supplying its own via `extend`. @default true */
  node: boolean;
}

const AI_GROUP = "AI";

/**
 * Builds slash items for each configured action, bound to `options.adapter`.
 * Every action operates on the document text up to the slash trigger — a
 * slash command never carries a real user text selection the way a bubble
 * toolbar action does, so there is nothing else to extract context from.
 */
export function createAiSlashItems(
  options: Pick<AiKitOptions, "adapter" | "actions">,
): SlashItem[] {
  const actions = options.actions ?? defaultAiSlashActions;

  return actions.map((action) => ({
    id: action.id,
    title: action.title,
    group: AI_GROUP,
    description: action.description,
    aliases: ["ai"],
    keywords: ["ai", "assistant"],
    icon: action.icon ?? "sparkles",
    when: (editor) => editor.schema.nodes[AiBlock.name] !== undefined,
    run: ({ editor, range }) => {
      const context = editor.state.doc
        .textBetween(0, range.from, "\n\n")
        .slice(-MAX_CONTEXT_LENGTH);
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .runAiAction({
          action: action.id,
          prompt: action.prompt,
          context,
          adapter: options.adapter,
        })
        .run();
    },
  }));
}
