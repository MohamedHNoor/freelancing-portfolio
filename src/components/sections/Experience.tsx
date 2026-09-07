import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { Badge } from "@/components/ui/badge";
import { getRoles } from "@/content";
import { cn } from "@/lib/utils";
import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";

/* `getRoles()` already returns newest first. No sorting here, so one place
   decides the order.

   Dates are real `<time>` elements wherever there is a machine-readable value.
   An ongoing role renders plain text instead, because the `"present"` sentinel
   is not a valid `datetime`. */
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
      {/* The rail is drawn by each entry's own left border plus its bottom
          padding rather than by a border on the list, so the line stays
          continuous through the gaps between entries. */}
      <ol role="list" className="space-y-0">
        {roles.map((role, index) => (
          <li
            key={role.id}
            className="lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-10"
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

            <div
              className={cn(
                "relative min-w-0 border-l border-border pl-8",
                index === roles.length - 1 ? "pb-0" : "pb-14",
                "mt-3 lg:mt-0",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute -left-1 top-1.5 size-2 rounded-full bg-brand ring-4 ring-background"
              />
              <Reveal>
                <h3 className="font-heading text-xl font-semibold tracking-tight">
                  {role.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-brand">
                  {role.company}
                </p>

                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {role.summary}
                </p>

                {role.impact.length > 0 ? (
                  <ul
                    role="list"
                    className="mt-4 max-w-2xl list-outside list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-brand"
                  >
                    {role.impact.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                {role.stack.length > 0 ? (
                  <ul
                    role="list"
                    aria-label={`Stack used at ${role.company}`}
                    className="mt-5 flex flex-wrap gap-2"
                  >
                    {role.stack.map((technology) => (
                      <li key={technology}>
                        <Badge variant="secondary">{technology}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
