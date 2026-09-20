import { mergeAttributes, Node } from "@tiptap/core";

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
});

/** Configures the callout node. */
export function callout(options: Partial<CalloutOptions> = {}) {
  return Callout.configure(options);
}
