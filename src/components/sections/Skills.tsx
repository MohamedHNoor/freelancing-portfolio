import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { TechIcon, hasTechIcon } from "@/components/icons/TechIcon";
import { getSkillGroups } from "@/content";

/* Groups render in `skills.ts` order, which that file declares canonical and
   which the hero technology row also reads. No sorting here.

   There is no proficiency value in this section, in any form. `Skill` carries no
   such field on purpose: a score awarded to yourself is the same kind of claim
   as the client-count tiles the plan removed. */
export function Skills() {
  const groups = getSkillGroups().filter((group) => group.skills.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Section
      id="skills"
      label="Stack"
      heading="What I build with, and where I have used it"
      lead="Grouped by where each one sits in a build, with the context it was used in. No self-assigned percentages: a score I award myself would not be evidence."
    >
      {/* No cards. Services is two large panels and Projects is three image
          cards, so a third run of boxes reads as card fatigue, and the box was
          what forced a column narrow enough to wrap all thirty context lines
          onto two lines.

          Ruled bands with the group name in a rail instead: the rail gives the
          label somewhere to live without a heading that competes with the
          section, and it leaves the body wide enough for two columns whose
          context lines still fit on one line. */}
      <ul role="list" className="space-y-10">
        {groups.map((group) => (
          <li key={group.id}>
            {/* `Reveal` wraps the grid rather than being it: a motion element
                set to `display: contents` generates no box, so its opacity and
                transform would be ignored and the entrance would silently do
                nothing. */}
            <Reveal className="border-t border-border pt-8 lg:grid lg:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] lg:gap-10">
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
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
