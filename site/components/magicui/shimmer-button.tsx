import { type CSSProperties, type MouseEventHandler, type ReactNode } from "react";

import { cn } from "@/lib/utils.ts";

/**
 * Vendored from MagicUI (`shimmer-button`): CTA button with a light sweeping around its edge.
 * The upstream component only renders a `<button>`; this one can render an `<a>` too, so a CTA
 * that navigates doesn't need a button nested inside a link.
 */
export interface ShimmerButtonProps {
  /** Renders the CTA as a link instead of a button. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  "aria-label"?: string;
  className?: string;
  children?: ReactNode;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export function ShimmerButton({
  href,
  onClick,
  "aria-label": ariaLabel,
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  borderRadius = "100px",
  shimmerDuration = "3s",
  background = "rgba(0, 0, 0, 1)",
  className,
  children,
}: ShimmerButtonProps) {
  const style = {
    "--spread": "90deg",
    "--shimmer-color": shimmerColor,
    "--radius": borderRadius,
    "--speed": shimmerDuration,
    "--cut": shimmerSize,
    "--bg": background,
  } as CSSProperties;

  const classes = cn(
    "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)]",
    "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
    className,
  );

  const inner = (
    <>
      {/* spark container */}
      <div className="-z-30 blur-[2px] [container-type:size] absolute inset-0 overflow-visible">
        {/* spark */}
        <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>
      {children}

      {/* highlight */}
      <div
        className={cn(
          "absolute inset-0 size-full",
          "rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]",
          "transform-gpu transition-all duration-300 ease-in-out",
          "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
          "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]",
        )}
      />

      {/* backdrop */}
      <div className="absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]" />
    </>
  );

  return href ? (
    <a href={href} onClick={onClick} aria-label={ariaLabel} style={style} className={classes}>
      {inner}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
      className={classes}
    >
      {inner}
    </button>
  );
}
