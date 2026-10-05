"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef } from "react";

const ITEMS = [
  "/h1",
  "/todo",
  "/table",
  "/columns",
  "/mermaid",
  "/callout",
  "/image",
  "/embed",
  "/toggle",
  "/quote",
  "/divider",
  "/ai",
];

/** Wraps into [-50, 0): the track holds two copies, so -50% is one copy's width. */
function wrap(value: number) {
  return (((value % 50) + 50) % 50) - 50;
}

/**
 * The page's only marquee. It lists every default block, and scroll speed
 * pushes it faster, so the strip answers the reader's own movement.
 */
export function SlashMarquee() {
  const reduce = useReducedMotion();
  const offset = useMotionValue(0);
  const direction = useRef(1);

  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(offset, (value) => `${wrap(value)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const v = boost.get();
    if (v < 0) direction.current = -1;
    else if (v > 0) direction.current = 1;
    const step = direction.current * -1.6 * (delta / 1000);
    offset.set(offset.get() + step + step * Math.abs(v));
  });

  const track = ITEMS.map((item, index) => (
    <span
      key={item}
      className={
        index % 2 === 0
          ? "text-foreground"
          : "text-transparent [-webkit-text-stroke:1.5px_var(--color-foreground)]"
      }
    >
      {item}
    </span>
  ));

  return (
    <div className="overflow-hidden py-6 md:py-8" aria-label="Default slash commands">
      <motion.div
        style={{ x }}
        className="flex w-max gap-12 font-semibold tracking-tighter whitespace-nowrap select-none md:gap-16 [&>div]:flex [&>div]:gap-12 md:[&>div]:gap-16"
      >
        {/* Two copies: the track wraps by exactly one copy's width. */}
        <div aria-hidden className="text-[clamp(3.5rem,9vw,8rem)] leading-none">
          {track}
        </div>
        <div aria-hidden className="text-[clamp(3.5rem,9vw,8rem)] leading-none">
          {track}
        </div>
      </motion.div>
    </div>
  );
}
