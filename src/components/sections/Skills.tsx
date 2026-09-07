import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { TechIcon, hasTechIcon } from "@/components/icons/TechIcon";
import { Card, CardContent } from "@/components/ui/card";
import { getSkillGroups } from "@/content";

/* Groups render in `skills.ts` order, which that file declares canonical and
   which the hero technology row also reads. No sorting here.

   There is no proficiency value in this section, in any form. `Skill` carries no
   such field on purpose: a score awarded to yourself is the same kind of claim
   as the client-count tiles the plan removed. */
export function Skills() {
  const groups = getSkillGroups();

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
      <ul
        role="list"
        className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {groups.map((group) =>
          group.skills.length === 0 ? null : (
            <li key={group.id} className="min-w-0">
              <Reveal>
                <Card className="[--card-spacing:--spacing(6)]">
                  <CardContent>
                    <h3 className="font-heading text-base font-semibold tracking-tight">
                      {group.label}
                    </h3>

                    <dl className="mt-5 space-y-4">
                      {group.skills.map((skill) => (
                        <div key={skill.name} className="min-w-0">
                          <dt className="flex items-center gap-2 text-sm font-medium">
                            {/* The slot is reserved whether or not a mark
                                exists, so names stay on one left edge across
                                the nine entries that have no logo. */}
                            <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                              {hasTechIcon(skill.icon) ? (
                                <TechIcon
                                  icon={skill.icon}
                                  className="size-4"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0">{skill.name}</span>
                          </dt>
                          <dd className="mt-1 pl-6 text-sm leading-relaxed text-muted-foreground">
                            {skill.context}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </Reveal>
            </li>
          ),
        )}
      </ul>
    </Section>
  );
}
