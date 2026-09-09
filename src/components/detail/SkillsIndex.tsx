import { TechIcon, hasTechIcon } from "@/components/icons/TechIcon";
import { getSkillGroups } from "@/content";

/* The ruled index, moved out of the home Skills section rather than rebuilt.
   The two-column body and the 9rem rail are the result of measuring characters
   per line: three columns wrapped every one of the thirty context lines onto
   two lines. Do not narrow it without re-measuring.

   No `Reveal`: the usage context is the reason this page exists. */
export function SkillsIndex() {
  const groups = getSkillGroups().filter((group) => group.skills.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <ul role="list" className="space-y-10">
      {groups.map((group) => (
        <li key={group.id}>
        <div className="border-t border-border pt-8 lg:grid lg:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] lg:gap-10">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground lg:pt-1">
              {group.label}
            </h3>

            <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:mt-0">
              {group.skills.map((skill) => (
                <div key={skill.name} className="min-w-0">
                  <dt className="flex items-center gap-2.5 text-[0.95rem] font-medium">
                    {/* The slot is reserved whether or not a mark exists, so
                        the nine entries with no logo keep their names on the
                        same left edge as the rest. */}
                    <span className="flex size-5 shrink-0 items-center justify-center text-foreground/80">
                      {hasTechIcon(skill.icon) ? (
                        <TechIcon
                          icon={skill.icon}
                          className="size-[1.15rem]"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">{skill.name}</span>
                  </dt>
                  {/* Indented to the name, not the mark: the 20px slot plus
                      the 10px gap. */}
                  <dd className="mt-1 pl-7.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {skill.context}
                  </dd>
                </div>
              ))}
            </dl>
        </div>
        </li>
      ))}
    </ul>
  );
}
