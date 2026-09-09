import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { TechIcon, hasTechIcon } from "@/components/icons/TechIcon";
import { getSkillGroups } from "@/content";

/* Names only here. Where each one was actually used is the whole argument this
   section makes, and it lives at `/skills`: thirty context lines is a page's
   worth of reading, not a summary's.

   Groups render in `skills.ts` order, which that file declares canonical and
   which the hero technology row also reads. No sorting here. There is still no
   proficiency value anywhere, by design. */
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
      lead="Grouped by where each one sits in a build. No self-assigned percentages: a score I award myself would not be evidence."
    >
      <Reveal>
        <dl className="space-y-8">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border-t border-border pt-6 lg:grid lg:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] lg:gap-10"
            >
              <dt className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground lg:pt-1.5">
                {group.label}
              </dt>
              <dd className="mt-4 lg:mt-0">
                <ul role="list" className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <li
                      key={skill.name}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                    >
                      {/* Unlike the index, no slot is reserved when a mark is
                          missing: chips are laid out inline, so there is no
                          left edge for a name to line up against. */}
                      {hasTechIcon(skill.icon) ? (
                        <TechIcon
                          icon={skill.icon}
                          className="size-4 shrink-0 text-foreground/80"
                        />
                      ) : null}
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <SectionLink href="/skills">See where I have used each one</SectionLink>
    </Section>
  );
}
