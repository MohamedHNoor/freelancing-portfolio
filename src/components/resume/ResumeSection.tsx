import type { ReactNode } from "react";

type ResumeSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

/** A titled resume section. The heading stays with its first entry when a page
 *  breaks, but the section itself may split, so a long one never moves whole
 *  onto the next sheet and leaves a gap at the foot of the one before. */
export function ResumeSection({ id, title, children }: ResumeSectionProps) {
  const headingId = `resume-${id}`;

  return (
    <section aria-labelledby={headingId} className="mt-9 print:mt-4">
      <h2
        id={headingId}
        className="break-after-avoid border-b border-border pb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand print:pb-1 print:tracking-[0.04em] print:text-[8.5pt]"
      >
        {title}
      </h2>
      <div className="mt-4 print:mt-2.5">{children}</div>
    </section>
  );
}
