import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getFeaturedProjects, getServices } from "@/content";
import { toProjectCardData } from "@/lib/projects";

/* `featured` is the only control on how long this section gets: the content
   layer decides what belongs here, and the index at `/projects` carries the
   rest. No slice, because silently hiding a project the user flagged as
   featured would be a surprise. */
export function Projects() {
  const services = getServices();
  const cards = getFeaturedProjects().map((project) =>
    toProjectCardData(project, services),
  );

  if (cards.length === 0) {
    return null;
  }

  const hasPlaceholder = cards.some((card) => card.isPlaceholder);

  return (
    <Section
      id="projects"
      label="Work"
      heading="What I have built, and what it changed"
      lead="Outcome first, with the measurement each number came from. Both tracks are represented."
    >
      {hasPlaceholder ? (
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          Projects marked <span className="text-foreground">Example project</span>{" "}
          are seeded examples rather than client work, and are replaced before
          this site goes live.
        </p>
      ) : null}

      {/* Two up from `lg`, stacked below it. A project card leads with a wide
          UI screenshot, and one card per row rendered that screenshot 1088px
          across, which is the case study's job rather than a teaser's and cost
          about a thousand pixels of scroll per project. Two columns keep the
          cover complete and still comfortably readable while the section fits
          on one screen. */}
      <ul role="list" className="grid gap-8 lg:grid-cols-2">
        {cards.map((card) => (
          <li key={card.slug}>
            <Reveal>
              <ProjectCard project={card} titleAs="h3" />
            </Reveal>
          </li>
        ))}
      </ul>

      <SectionLink href="/projects">View all projects</SectionLink>
    </Section>
  );
}
