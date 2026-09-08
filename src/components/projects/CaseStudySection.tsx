import type { CaseStudySection as CaseStudySectionContent } from "@/types/content";

type CaseStudySectionProps = {
  section: CaseStudySectionContent;
};

/* Not wrapped in `Reveal`. Reveal server-renders `opacity: 0`, which its own
   docstring calls a fine trade for decoration below the fold and a bad one for
   anything load-bearing. The case study body is the single thing a client came
   to read, so it must not depend on JavaScript having run.

   The heading sits in a rail beside its prose at `lg`, so the four stages can
   be scanned and jumped between without reading the whole page. */
export function CaseStudySection({ section }: CaseStudySectionProps) {
  const headingId = `case-study-${section.heading.toLowerCase()}`;

  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-border pt-8 lg:grid lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] lg:gap-12"
    >
      <h2
        id={headingId}
        className="font-mono text-xs uppercase tracking-[0.2em] text-brand lg:pt-1.5"
      >
        {section.heading}
      </h2>

      <div className="mt-5 max-w-2xl lg:mt-0">
        <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
          {section.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        {section.bullets !== undefined && section.bullets.length > 0 ? (
          <ul
            role="list"
            className="mt-6 list-outside list-disc space-y-2.5 pl-5 marker:text-brand"
          >
            {section.bullets.map((bullet) => (
              <li
                key={bullet}
                className="pl-1 text-base leading-relaxed text-muted-foreground"
              >
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
