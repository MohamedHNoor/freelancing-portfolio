"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/* strict is deliberate: it throws if a full `motion` component renders inside,
   which is the only reliable guard against silently undoing the code split.

   reducedMotion="user" handles the accessibility rule once, globally. Branching
   per component on useReducedMotion() instead would change what each component
   renders between the server and the client, which desynchronises hydration. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
