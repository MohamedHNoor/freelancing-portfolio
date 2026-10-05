import type { ReactNode } from "react";
import { DotList } from "@/components/resume/DotList";

type ResumeItemProps = {
  /** The `h3` content: a role title, or a project name and subtitle. */
  heading: ReactNode;
  /** Dates or a period, beside the heading from `sm` and under it below. */
  aside?: ReactNode;
  /** The organisation and location, or the project role. */
  meta?: ReactNode;
  description?: string;
  highlights: readonly string[];
  technologies?: readonly string[];
  /** A trailing line, such as a case study link. */
  footer?: ReactNode;
};

/** One role or project. Kept on one sheet when printed, and its paragraphs
 *  never leave a single line stranded at a page edge. */
export function ResumeItem({
  heading,
  aside,
  meta,
  description,
  highlights,
  technologies = [],
  footer,
}: ResumeItemProps) {
  return (
    <div className="break-inside-avoid">
      <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-6">
        <h3 className="font-heading text-base font-semibold tracking-tight sm:text-[1.0625rem] print:text-[11pt]">
          {heading}
        </h3>
        {aside ? (
          <p className="mt-0.5 shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground sm:mt-0 print:text-[8.5pt] print:tracking-[0.04em]">
            {aside}
          </p>
        ) : null}
      </div>

      {meta ? (
        <p className="mt-0.5 text-sm text-muted-foreground print:text-[9.5pt]">
          {meta}
        </p>
      ) : null}

      {description ? (
        <p className="mt-2 text-sm leading-relaxed sm:text-[0.9375rem] print:mt-1.5 print:text-[10pt] print:leading-snug">
          {description}
        </p>
      ) : null}

      {highlights.length > 0 ? (
        <ul
          role="list"
          className="mt-2 list-outside list-disc space-y-1 pl-5 marker:text-brand print:mt-1.5 print:space-y-0.5"
        >
          {highlights.map((highlight) => (
            <li
              key={highlight}
              className="pl-1 text-sm leading-relaxed sm:text-[0.9375rem] print:text-[10pt] print:leading-snug"
            >
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}

      {technologies.length > 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground print:mt-1.5 print:text-[9.5pt]">
          <span className="font-medium text-foreground">Technologies: </span>
          <DotList items={technologies} />
        </p>
      ) : null}

      {footer}
    </div>
  );
}
