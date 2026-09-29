"use client";

import { useId, type SVGProps } from "react";

import { cn } from "@/lib/utils.ts";

/**
 * Vendored from MagicUI (`dot-pattern`): a dot grid that fills its container.
 * Upstream renders one `<circle>` per dot (and animates them when `glow` is set); this version
 * tiles a single `<pattern>`, which renders the same static grid for a fraction of the DOM.
 */
interface DotPatternProps extends SVGProps<SVGSVGElement> {
  /** Horizontal spacing between dots. */
  width?: number;
  /** Vertical spacing between dots. */
  height?: number;
  /** X offset of the whole grid. */
  x?: number;
  /** Y offset of the whole grid. */
  y?: number;
  /** X offset of a dot inside its cell. */
  cx?: number;
  /** Y offset of a dot inside its cell. */
  cy?: number;
  /** Dot radius. */
  cr?: number;
  className?: string;
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={`${id}-dots`}
          x={x}
          y={y}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
    </svg>
  );
}
