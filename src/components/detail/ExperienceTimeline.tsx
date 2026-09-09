import { Badge } from "@/components/ui/badge";
import { getRoles } from "@/content";
import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

/* The full timeline, carrying what the home summary drops: the impact bullets
   and the per-role stack.

   `getRoles()` already returns newest first, so one place decides the order.
   Dates are real `<time>` elements wherever there is a machine-readable value;
   an ongoing role renders plain text, because the `"present"` sentinel is not a
   valid `datetime`.

   No `Reveal`: on this page the detail is the reason to be here. */
export function ExperienceTimeline() {
  const roles = getRoles();

  if (roles.length === 0) {
    return null;
  }

  return (
    /* The rail is drawn by each entry's own left border plus its bottom padding
       rather than by a border on the list, so the line stays continuous through
       the gaps between entries. */
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
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {role.title}
            </h2>
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
          </div>
        </li>
      ))}
    </ol>
  );
}
