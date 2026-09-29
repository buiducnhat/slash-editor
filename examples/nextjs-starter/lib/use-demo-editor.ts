import type { ToggleOptions } from "@slash-editor/core";
import { useSlashEditor, type UseSlashEditorOptions } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";

/**
 * Lucide `chevron-right`, inlined: the toggle's disclosure button is plain DOM
 * created by the node view, so the icon is markup rather than a React root per
 * toggle. Open state rotates it in CSS.
 */
const CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

const renderToggleButton: ToggleOptions["renderToggleButton"] = ({ element, isOpen }) => {
  if (!element.firstChild) {
    element.innerHTML = CHEVRON;
  }

  element.dataset.state = isOpen ? "open" : "closed";
  // Overriding the option drops Tiptap's own label, so restate it here.
  element.setAttribute("aria-label", isOpen ? "Collapse toggle" : "Expand toggle");
};

/**
 * `useSlashEditor` with the playground's shared defaults. Every demo editor
 * goes through here so the disclosure marker is the same lucide chevron
 * everywhere, not just in the editors that happen to configure a block kit.
 */
export function useDemoEditor(options: UseSlashEditorOptions = {}): Editor | null {
  const { blockKit, ...rest } = options;

  return useSlashEditor({
    ...rest,
    blockKit: blockKit === false ? false : { toggle: { renderToggleButton }, ...blockKit },
  });
}
