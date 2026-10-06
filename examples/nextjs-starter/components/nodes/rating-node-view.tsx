import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, useEditorState } from "@tiptap/react";
import { StarIcon } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils.ts";

export const MAX_RATING = 5;

const STARS = Array.from({ length: MAX_RATING }, (_, index) => index + 1);

/**
 * Clickable stars bound to the node's `value` attribute. Semantically a radio
 * group: one tab stop (the selected star, or the first), arrow keys move and
 * select, and clicking the selected star clears the rating. `label` is plain
 * text edited through the same `updateAttributes` API.
 */
export function RatingNodeView({ editor, node, updateAttributes }: NodeViewProps) {
  const value = node.attrs.value as number;
  const label = node.attrs.label as string;
  const editable = useEditorState({ editor, selector: ({ editor: current }) => current.isEditable });
  const stars = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: number) {
    updateAttributes({ value: next });
    // Focus follows the selection, as in a native radio group.
    if (next > 0) stars.current[next - 1]?.focus();
  }

  function onKeyDown(event: KeyboardEvent, star: number) {
    const next = {
      ArrowRight: Math.min(star + 1, MAX_RATING),
      ArrowUp: Math.min(star + 1, MAX_RATING),
      ArrowLeft: Math.max(star - 1, 1),
      ArrowDown: Math.max(star - 1, 1),
      Home: 1,
      End: MAX_RATING,
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <NodeViewWrapper
      data-type="rating"
      className="border-border bg-card my-2 flex items-center gap-3 rounded-md border px-3 py-2"
    >
      <div
        role="radiogroup"
        aria-label={label || "Rating"}
        contentEditable={false}
        className="flex shrink-0 items-center gap-0.5"
      >
        {STARS.map((star) => (
          <button
            key={star}
            ref={(element) => {
              stars.current[star - 1] = element;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} of ${MAX_RATING} stars`}
            disabled={!editable}
            // One tab stop: the selected star, or the first when unrated.
            tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => select(value === star ? 0 : star)}
            onKeyDown={(event) => onKeyDown(event, star)}
            className="focus-visible:ring-ring/50 rounded-sm p-0.5 outline-none focus-visible:ring-2 disabled:cursor-default"
          >
            <StarIcon
              aria-hidden
              className={cn(
                "size-5 transition-colors",
                star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50",
              )}
            />
          </button>
        ))}
      </div>
      {editable ? (
        <input
          value={label}
          placeholder="Add a label…"
          aria-label="Rating label"
          contentEditable={false}
          spellCheck={false}
          onChange={(event) => updateAttributes({ label: event.target.value })}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      )}
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {value}/{MAX_RATING}
      </span>
    </NodeViewWrapper>
  );
}
