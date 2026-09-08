import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  /** Anchor target, matching a `NAV_ITEMS` href. */
  id: string;
  label: string;
  heading: string;
  lead?: string;
  className?: string;
  children: ReactNode;
};

/** Shared section shell: eyebrow, heading, optional lead, body. The heading is
 *  always an `h2` because the hero owns the page's only `h1`, and the section is
 *  labelled by it so it reads as a named region rather than an anonymous block. */
export function Section({
  id,
  label,
  heading,
  lead,
  className,
  children,
}: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      /* Vertical rhythm for the whole page. Two adjacent sections each
         contribute their own padding, so the gap a reader sees is double these
         numbers: 96px on a phone, 128px on a desktop. The original
         `py-20 sm:py-28` made that 224px, which read as the page having run out
         of content rather than as breathing room. Anything that changes here
         must change in the hero and on `/projects` too, which set their own
         padding to sit in this same rhythm. */
      /* No `scroll-mt` here. `html` already sets `scroll-padding-top: 5.5rem`
         to clear the sticky header, and the two offsets stack rather than
         overlap: the browser lines the element's scroll margin box up with the
         container's scroll padding edge, so 96px plus 88px landed every anchor
         184px down instead of 88px. `scroll-padding-top` is the one that stays,
         because it is set once and also covers `#main-content` and any anchor a
         later feature adds. */
      className={cn("py-12 sm:py-14 lg:py-16", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
          {label}
        </p>
        <h2
          id={headingId}
          className="mt-4 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {heading}
        </h2>
        {lead ? (
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{lead}</p>
        ) : null}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
