"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN = { opacity: 0, y: 18 };
const SHOWN = { opacity: 1, y: 0 };

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Wait until scrolled into view instead of playing on mount. */
  inView?: boolean;
}

/**
 * Entrance that orders attention: hero pieces arrive in reading order, later
 * sections arrive as they are reached. Server and first client render must
 * match, so reduced motion only zeroes the transition and the entrance
 * resolves instantly.
 */
export function Reveal({ children, className, delay = 0, inView = false }: RevealProps) {
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : { duration: 0.7, delay, ease: EASE };

  if (inView) {
    return (
      <motion.div
        className={className}
        initial={HIDDEN}
        whileInView={SHOWN}
        viewport={{ once: true, amount: 0.15 }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={className} initial={HIDDEN} animate={SHOWN} transition={transition}>
      {children}
    </motion.div>
  );
}
