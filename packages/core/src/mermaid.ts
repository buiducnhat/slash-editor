import { mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { CodeBlock, type CodeBlockOptions } from "@tiptap/extension-code-block";

export type MermaidOptions = Pick<
  CodeBlockOptions,
  | "exitOnTripleEnter"
  | "exitOnArrowDown"
  | "exitOnArrowUp"
  | "enableTabIndentation"
  | "tabSize"
  | "HTMLAttributes"
>;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaid: {
      /** Turns the current textblock into a Mermaid diagram, keeping its text as source. */
      setMermaid: () => ReturnType;
      /** Toggles between a Mermaid diagram and a paragraph. */
      toggleMermaid: () => ReturnType;
    };
  }
}

const LANGUAGE = "mermaid";

/**
 * A Mermaid diagram whose source is the node's own text (`content: "text*"`),
 * never an attribute: under Yjs an attribute is last-write-wins, so two people
 * editing one diagram would clobber each other, while text merges per
 * character. Core only owns the source; rendering is a UI-layer `NodeView`.
 *
 * Extends `CodeBlock` for its source-editing keymap (literal newlines,
 * triple-Enter and arrow exits, Tab indentation) and overrides every field
 * that would collide with the real `codeBlock`: its commands, its
 * `Mod-Alt-c` shortcut, its fixed-key paste plugin, and its catch-all
 * `pre`/`code` parsing. The higher priority orders this node's input rule,
 * HTML parse rules, and markdown `code` handler ahead of `codeBlock`'s, so a
 * ```` ```mermaid ```` fence never lands as a plain code block.
 */
export const Mermaid = CodeBlock.extend<MermaidOptions>({
  name: "mermaid",
  priority: 110,
  addOptions() {
    return {
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      exitOnArrowUp: true,
      enableTabIndentation: true,
      tabSize: 4,
      HTMLAttributes: {},
    };
  },
  addAttributes() {
    return {};
  },
  parseHTML() {
    return [
      { tag: `pre[data-type="${this.name}"]`, preserveWhitespace: "full" },
      // Fenced HTML from elsewhere (GitHub, markdown-it) marks the language on <code>.
      {
        tag: "pre",
        preserveWhitespace: "full",
        getAttrs: (element) =>
          element.firstElementChild?.classList.contains(`language-${LANGUAGE}`) ? null : false,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": this.name }),
      ["code", 0],
    ];
  },
  markdownTokenName: "code",
  // Declining (`[]`) hands the token on to `codeBlock`'s handler.
  parseMarkdown: (token, h) =>
    token.lang?.trim() === LANGUAGE && token.codeBlockStyle !== "indented"
      ? h.createNode("mermaid", null, token.text ? [h.createTextNode(token.text)] : [])
      : [],
  renderMarkdown: (node, h) =>
    [`\`\`\`${LANGUAGE}`, h.renderChildren(node.content ?? []), "```"].join("\n"),
  addCommands() {
    return {
      setMermaid:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
      toggleMermaid:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, "paragraph"),
    };
  },
  addKeyboardShortcuts() {
    const shortcuts = { ...this.parent?.() };
    delete shortcuts["Mod-Alt-c"];
    return shortcuts;
  },
  addInputRules() {
    return [
      textblockTypeInputRule({ find: /^```mermaid[\s\n]$/, type: this.type }),
      textblockTypeInputRule({ find: /^~~~mermaid[\s\n]$/, type: this.type }),
    ];
  },
  addProseMirrorPlugins() {
    return [];
  },
});

/** Configures the Mermaid diagram node. */
export function mermaid(options: Partial<MermaidOptions> = {}) {
  return Mermaid.configure(options);
}
