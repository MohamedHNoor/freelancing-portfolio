import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { getRoles } from "@/content";
import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";

/* Dates, titles and one line each. What changed because I was there, and the
   stack behind it, lives at `/experience`.

   `getRoles()` already returns newest first, so one place decides the order.
   Dates are real `<time>` elements wherever there is a machine-readable value;
   an ongoing role renders plain text, because the `"present"` sentinel is not a
   valid `datetime`. */
export function Experience() {
  const roles = getRoles();

  if (roles.length === 0) {
    return null;
  }

  return (
    <Section
      id="experience"
      label="Experience"
      heading="Where I have worked"
      lead="Reverse chronological, with what changed because I was there rather than a list of duties."
    >
      <Reveal>
        <ol role="list" className="space-y-6">
          {roles.map((role) => (
            <li
              key={role.id}
              className="border-t border-border pt-6 lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-10"
            >
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground lg:pt-1 lg:text-right">
                <time dateTime={role.start}>{formatYearMonth(role.start)}</time>
                {" - "}
                {role.end === PRESENT ? (
                  "Present"
                ) : (
                  <time dateTime={role.end}>{formatRoleEnd(role.end)}</time>
                )}
              </p>

              <div className="mt-2 min-w-0 lg:mt-0">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {role.title}
                  <span className="text-muted-foreground"> at </span>
                  <span className="text-brand">{role.company}</span>
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {role.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <SectionLink href="/experience">See the full history</SectionLink>
    </Section>
  );
}
