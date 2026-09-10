"use client";

import { useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { TechIcon } from "@/components/icons/TechIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Skill } from "@/types/content";

const LABEL_ID = "hero-stack-label";

/* The one client island in the hero, and deliberately a leaf.
 *
 *  The row scrolls on a 48s infinite loop, which WCAG 2.1 SC 2.2.2 (Pause,
 *  Stop, Hide, Level A) says needs a mechanism to stop. It used to have only
 *  `hover:[animation-play-state:paused]`, and the chips are plain `li` elements
 *  with nothing focusable inside, so a keyboard-only visitor had no route to
 *  that state and no way to stop the motion at all.
 *
 *  `Hero` stays a server component because of this split. Putting `useState` in
 *  `Hero` would drag the headline, the calls to action and the code card into
 *  the client bundle, and the headline's neighbouring paragraph is the largest
 *  contentful element on the page. */
export function TechMarquee({ marks }: { marks: readonly Skill[] }) {
  const [paused, setPaused] = useState(false);

  const label = paused
    ? "Resume the technology row"
    : "Pause the technology row";

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2">
        <p
          id={LABEL_ID}
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
        >
          Working with
        </p>
        {/* Hidden rather than disabled under reduced motion, because there is
            no animation left to control: the track is already `animate-none`.
            Done in CSS instead of by reading the media query during render,
            which would make the server and client markup disagree. `TypedCode`
            documents the same trap. */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setPaused((value) => !value)}
          aria-label={label}
          title={label}
          className="text-muted-foreground motion-reduce:hidden"
        >
          {paused ? (
            <PlayIcon aria-hidden="true" />
          ) : (
            <PauseIcon aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Two identical copies scrolled by exactly one copy width, so the loop is
          seamless. Reduced motion stops the scroll and wraps the single visible
          copy instead. */}
      <div className="relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:[mask-image:none]">
        <div
          /* Hovering still pauses it for a mouse user. An explicit pause is an
             inline style so it wins over that hover rule rather than fighting
             it: while paused the pointer cannot restart the scroll by leaving. */
          className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap"
          style={paused ? { animationPlayState: "paused" } : undefined}
        >
          <TechRow marks={marks} labelledBy={LABEL_ID} />
          <TechRow marks={marks} duplicate />
        </div>
      </div>
    </div>
  );
}

type TechRowProps = {
  marks: readonly Skill[];
  labelledBy?: string;
  /** The second copy exists only to make the scroll loop seamless, so it is
   *  hidden from assistive technology and removed under reduced motion. */
  duplicate?: boolean;
};

function TechRow({ marks, labelledBy, duplicate = false }: TechRowProps) {
  return (
    <ul
      aria-labelledby={labelledBy}
      aria-hidden={duplicate || undefined}
      className={cn(
        "flex shrink-0 gap-2 pr-2",
        duplicate
          ? "motion-reduce:hidden"
          : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-2",
      )}
    >
      {marks.map((skill) => (
        <li
          key={skill.name}
          className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
        >
          {skill.icon ? (
            <TechIcon icon={skill.icon} className="size-3.5 shrink-0" />
          ) : null}
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
