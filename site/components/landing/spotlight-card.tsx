"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import type { PointerEvent } from "react";

import { cn } from "@/lib/utils.ts";

/**
 * Card whose accent glow follows the pointer, so the hovered cell reads as the
 * active one. Pointer position lives in motion values, never React state.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(360px circle at ${x}px ${y}px, var(--color-brand-soft), transparent 70%)`;

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  return (
    <article
      onPointerMove={onPointerMove}
      className={cn(
        "group border-border bg-card hover:border-brand/60 relative flex flex-col gap-6 overflow-hidden rounded-xl border p-6 transition-colors duration-300 md:p-8",
        className,
      )}
    >
      <motion.div
        aria-hidden
        style={{ background: glow }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </article>
  );
}
