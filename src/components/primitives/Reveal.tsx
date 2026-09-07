"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Scroll entrance for secondary content. Never wrap the largest contentful
 *  element in this: animating the LCP element in from opacity 0 delays it.
 *
 *  Reduced motion is applied globally by MotionConfig in MotionProvider, which
 *  drops the transform and keeps the fade, so this renders identical markup for
 *  every visitor. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}
