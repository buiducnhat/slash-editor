import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, useEditorState } from "@tiptap/react";
import { cn } from "@/lib/utils.ts";

export const STATUS_TONES = ["info", "success", "warning", "danger"] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

export function nextStatusTone(tone: StatusTone): StatusTone {
  return STATUS_TONES[(STATUS_TONES.indexOf(tone) + 1) % STATUS_TONES.length]!;
}

const TONE_CLASS: Record<StatusTone, string> = {
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

/**
 * Inline pill. Clicking it (or pressing Enter while it is the selected node,
 * see the extension's keymap) steps `tone` to the next colour.
 */
export function StatusNodeView({ editor, node, updateAttributes }: NodeViewProps) {
  const tone = node.attrs.tone as StatusTone;
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable });

  return (
    <NodeViewWrapper
      as="span"
      data-type="status"
      data-tone={tone}
      title={editable ? "Click to change the tone" : undefined}
      onClick={() => {
        if (editable) updateAttributes({ tone: nextStatusTone(tone) });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 align-baseline text-xs leading-5 font-medium select-none",
        editable && "cursor-pointer",
        TONE_CLASS[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {node.attrs.text as string}
    </NodeViewWrapper>
  );
}
