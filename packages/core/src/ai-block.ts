import { Extension, mergeAttributes, Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import type { Mapping } from "@tiptap/pm/transform";
import { findNodeById } from "./upload.ts";
import type { SlashItem } from "./slash-items.ts";

/** Lifecycle of a transient `aiBlock` node. */
export type AiActionStatus = "streaming" | "done" | "error";
export type AiScope = "cursor" | "selection" | "block";
export type AiActionContext = "slash" | "selection" | "block";
export type AiAcceptMode = "replace" | "insert";

export interface StreamContext {
  signal: AbortSignal;
}

export interface AiRequest {
  action: string;
  prompt: string;
  context: string;
  scope: AiScope;
}

export interface StreamAdapter {
  stream(request: AiRequest, context: StreamContext): AsyncIterable<string>;
}

export interface AiSourceRange {
  from: number;
  to: number;
  deleted: boolean;
}

interface PendingEntry {
  request: AiRequest;
  adapter: StreamAdapter;
  controller: AbortController;
  source: AiSourceRange | null;
}

/** Per-node AI request state, including a source range mapped through later document changes. */
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

  map(mapping: Mapping): void {
    for (const entry of this.pending.values()) {
      if (!entry.source || entry.source.deleted) continue;
      const from = mapping.mapResult(entry.source.from, 1);
      const to = mapping.mapResult(entry.source.to, -1);
      entry.source = {
        from: from.pos,
        to: to.pos,
        deleted: from.deletedAcross || to.deletedAcross || from.pos >= to.pos,
      };
    }
  }
}

function applyAiAttrs(editor: Editor, id: string, patch: Record<string, unknown>): void {
  const location = findNodeById(editor.state.doc, id);
  if (!location || location.node.type.name !== AiBlock.name) return;
  editor.view.dispatch(
    editor.state.tr
      .setNodeMarkup(location.pos, undefined, { ...location.node.attrs, ...patch })
      .setMeta("addToHistory", false),
  );
}

function runAiStream(
  editor: Editor,
  id: string,
  request: AiRequest,
  adapter: StreamAdapter,
  pending: PendingAiRegistry,
  source: AiSourceRange | null,
): void {
  const controller = new AbortController();
  pending.set(id, { request, adapter, controller, source });

  void (async () => {
    try {
      let text = "";
      for await (const chunk of adapter.stream(request, { signal: controller.signal })) {
        if (controller.signal.aborted) return;
        text += chunk;
        applyAiAttrs(editor, id, { text, status: "streaming", error: null });
      }
      if (!controller.signal.aborted) applyAiAttrs(editor, id, { status: "done" });
    } catch (error) {
      if (controller.signal.aborted) return;
      applyAiAttrs(editor, id, {
        status: "error",
        error: error instanceof Error ? error.message : "AI request failed",
      });
    }
  })();
}

export interface RunAiActionOptions {
  action: string;
  prompt: string;
  scope: AiScope;
  /** Block position for block-scoped actions. */
  pos?: number;
  /** Overrides the editor-level adapter for one request. */
  adapter?: StreamAdapter;
}

export interface AcceptAiActionOptions {
  /** `replace` replaces the mapped source range; `insert` keeps it and inserts the result below. */
  mode?: AiAcceptMode;
}

export interface AiAction {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  prompt: string;
  contexts: AiActionContext[];
}

export interface AiKitOptions {
  adapter: StreamAdapter;
  actions: AiAction[];
  /** Opts out of the built-in node when a host supplies a NodeView-augmented variant. */
  node: boolean;
}

export interface AiStorage {
  adapter: StreamAdapter;
  actions: AiAction[];
}

export const defaultAiActions: AiAction[] = [
  {
    id: "continue-writing",
    title: "Continue writing",
    description: "AI extends the text above the cursor",
    icon: "pencil-sparkles",
    prompt:
      "Continue writing the document naturally, matching its tone and style. Write only the continuation, with no preamble.",
    contexts: ["slash", "block"],
  },
  {
    id: "summarize",
    title: "Summarize",
    description: "Summarize the source text",
    icon: "broom-sparkles",
    prompt: "Summarize the following text in a few concise sentences.",
    contexts: ["slash", "selection", "block"],
  },
  {
    id: "brainstorm-ideas",
    title: "Brainstorm ideas",
    description: "List ideas related to the source text",
    icon: "brain",
    prompt: "Brainstorm a short bullet list of ideas related to the following text.",
    contexts: ["slash", "selection", "block"],
  },
  {
    id: "improve-writing",
    title: "Improve writing",
    description: "Rewrite for clarity and flow",
    icon: "sparkles",
    prompt:
      "Improve the clarity, flow, and tone of the following text while preserving its meaning.",
    contexts: ["selection", "block"],
  },
  {
    id: "fix-spelling-grammar",
    title: "Fix spelling & grammar",
    description: "Correct mistakes without changing the meaning",
    icon: "spell-check",
    prompt:
      "Rewrite the following text, correcting spelling and grammar mistakes only, and preserve its meaning and tone.",
    contexts: ["slash", "selection", "block"],
  },
  {
    id: "make-shorter",
    title: "Make shorter",
    icon: "minimize-2",
    prompt: "Rewrite the following text more concisely while preserving its meaning.",
    contexts: ["selection", "block"],
  },
  {
    id: "make-longer",
    title: "Make longer",
    icon: "maximize-2",
    prompt: "Expand the following text with useful detail while preserving its tone and meaning.",
    contexts: ["selection", "block"],
  },
];

/** Editor-level AI capability shared by slash, selection, and block surfaces. */
export const Ai = Extension.create<AiKitOptions, AiStorage>({
  name: "ai",

  addOptions() {
    return { adapter: { async *stream() {} }, actions: defaultAiActions, node: true };
  },

  addStorage() {
    return { adapter: this.options.adapter, actions: this.options.actions };
  },
});

export function ai(options: Pick<AiKitOptions, "adapter"> & Partial<AiKitOptions>) {
  return Ai.configure({ actions: defaultAiActions, node: true, ...options });
}

export interface AiBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface AiBlockStorage {
  pending: PendingAiRegistry;
}

function resolveRequest(
  editor: Editor,
  options: RunAiActionOptions,
): {
  request: AiRequest;
  source: AiSourceRange | null;
  insertAt: number;
} | null {
  const { state } = editor;
  const { selection, doc } = state;
  let context = "";
  let source: AiSourceRange | null = null;
  let insertAt: number;

  if (options.scope === "block") {
    if (options.pos === undefined) return null;
    const node = doc.nodeAt(options.pos);
    if (!node) return null;
    context = node.textContent;
    source = { from: options.pos, to: options.pos + node.nodeSize, deleted: false };
    insertAt = source.to;
  } else if (options.scope === "selection") {
    if (selection.empty) return null;
    context = doc.textBetween(selection.from, selection.to, "\n\n");
    source = { from: selection.from, to: selection.to, deleted: false };
    const $to = doc.resolve(selection.to);
    insertAt = $to.depth > 0 ? $to.after(1) : selection.to;
  } else {
    context = doc.textBetween(0, selection.from, "\n\n").slice(-4000);
    const $from = doc.resolve(selection.from);
    insertAt = $from.depth > 0 ? $from.after(1) : selection.from;
  }

  return {
    request: { action: options.action, prompt: options.prompt, context, scope: options.scope },
    source,
    insertAt,
  };
}

function paragraphs(editor: Editor, text: string): Fragment {
  const paragraph = editor.schema.nodes.paragraph;
  if (!paragraph) return Fragment.empty;
  const lines = text
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);
  return Fragment.fromArray(
    lines.length > 0
      ? lines.map((line) => paragraph.create(null, editor.schema.text(line)))
      : [paragraph.create()],
  );
}

declare module "@tiptap/core" {
  interface Storage {
    ai: AiStorage;
    aiBlock: AiBlockStorage;
  }
  interface Commands<ReturnType> {
    aiBlock: {
      runAiAction: (options: RunAiActionOptions) => ReturnType;
      retryAiAction: (id: string) => ReturnType;
      acceptAiAction: (id: string, options?: AcceptAiActionOptions) => ReturnType;
      discardAiAction: (id: string) => ReturnType;
    };
  }
}

/** Transient streamed output. Keep converts it to regular paragraph nodes. */
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

  excludeFromMarkdown: () => true,

  addCommands() {
    return {
      runAiAction:
        (options) =>
        ({ state, tr, dispatch }) => {
          const adapter = options.adapter ?? this.editor.storage.ai?.adapter;
          const resolved = resolveRequest(this.editor, options);
          if (!adapter || !resolved) return false;
          const id = crypto.randomUUID();
          const node = state.schema.nodes[this.name]?.create({
            id,
            action: resolved.request.action,
            prompt: resolved.request.prompt,
            text: "",
            status: "streaming",
            error: null,
          });
          if (!node) return false;
          if (dispatch) {
            tr.insert(resolved.insertAt, node);
            queueMicrotask(() =>
              runAiStream(
                this.editor,
                id,
                resolved.request,
                adapter,
                this.storage.pending,
                resolved.source,
              ),
            );
          }
          return true;
        },
      retryAiAction:
        (id) =>
        ({ state, dispatch }) => {
          const entry = this.storage.pending.get(id);
          const location = findNodeById(state.doc, id);
          if (!entry || !location || location.node.type.name !== this.name) return false;
          if (dispatch) {
            queueMicrotask(() => {
              applyAiAttrs(this.editor, id, { text: "", status: "streaming", error: null });
              runAiStream(
                this.editor,
                id,
                entry.request,
                entry.adapter,
                this.storage.pending,
                entry.source,
              );
            });
          }
          return true;
        },
      acceptAiAction:
        (id, options = {}) =>
        ({ state, tr, dispatch }) => {
          const entry = this.storage.pending.get(id);
          const location = findNodeById(state.doc, id);
          if (!location || location.node.type.name !== this.name) return false;
          if (dispatch) {
            const content = paragraphs(
              this.editor,
              (location.node.attrs.text as string | null) ?? "",
            );
            const replace = options.mode === "replace" && entry?.source && !entry.source.deleted;
            if (replace && entry.source) {
              tr.replaceWith(entry.source.from, entry.source.to, content);
              const mappedLocation = tr.mapping.map(location.pos);
              tr.delete(mappedLocation, mappedLocation + location.node.nodeSize);
            } else {
              tr.replaceWith(location.pos, location.pos + location.node.nodeSize, content);
            }
          }
          this.storage.pending.delete(id);
          return true;
        },
      discardAiAction:
        (id) =>
        ({ state, tr, dispatch }) => {
          const location = findNodeById(state.doc, id);
          if (!location || location.node.type.name !== this.name) return false;
          if (dispatch) tr.delete(location.pos, location.pos + location.node.nodeSize);
          this.storage.pending.delete(id);
          return true;
        },
    };
  },

  onTransaction({ transaction }) {
    if (transaction.docChanged) this.storage.pending.map(transaction.mapping);
  },
});

export function aiBlock(options: Partial<AiBlockOptions> = {}) {
  return AiBlock.configure(options);
}

/** Generates slash entries; the adapter is resolved from editor storage when selected. */
export function createAiSlashItems(actions: AiAction[]): SlashItem[] {
  return actions
    .filter((action) => action.contexts.includes("slash"))
    .map((action) => ({
      id: action.id,
      title: action.title,
      group: "AI",
      description: action.description,
      aliases: ["ai"],
      keywords: ["ai", "assistant"],
      icon: action.icon ?? "sparkles",
      when: (editor) =>
        editor.schema.nodes[AiBlock.name] !== undefined && editor.storage.ai?.adapter !== undefined,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        editor.commands.runAiAction({ action: action.id, prompt: action.prompt, scope: "cursor" });
      },
    }));
}
