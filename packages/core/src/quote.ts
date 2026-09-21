import { wrappingInputRule } from "@tiptap/core";
import { Blockquote, type BlockquoteOptions } from "@tiptap/extension-blockquote";

export type QuoteOptions = BlockquoteOptions;

/** `"` + space at the start of a block, Notion style. */
export const quoteInputRegex = /^\s*"\s$/;

/**
 * Blockquote with its markdown shorthand moved from `>` to `"`. The node name
 * stays `blockquote`: only the input rule changes, so stored documents,
 * clipboard HTML, and `Mod+Shift+B` are untouched.
 *
 * `>` belongs to the toggle (see `toggle.ts`), which is what Notion users
 * reach for it expecting.
 */
export const Quote = Blockquote.extend({
  addInputRules() {
    return [wrappingInputRule({ find: quoteInputRegex, type: this.type })];
  },
});

/** Configures the quote (blockquote) node. */
export function quote(options: Partial<QuoteOptions> = {}) {
  return Quote.configure(options);
}
