"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import {
  filterProjects,
  getCategoryFacets,
  getStackFacets,
  type ProjectCardData,
  type ProjectFilterState,
} from "@/lib/projects";

const NO_FILTERS: ProjectFilterState = { category: null, stack: null };

/* Takes the card projection rather than `Project`, so choosing which cards to
   show does not drag every case study into the client payload.

   Facets and the visible set are derived on every render with no `useMemo`:
   the React Compiler is on for this project, and three projects would not
   justify hand-memoising even if it were not. */
export function ProjectIndex({
  projects,
}: {
  projects: readonly ProjectCardData[];
}) {
  const [filters, setFilters] = useState<ProjectFilterState>(NO_FILTERS);

  if (projects.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        No projects are published yet.
      </p>
    );
  }

  const visible = filterProjects(projects, filters);
  const hasPlaceholder = projects.some((project) => project.isPlaceholder);

  return (
    <div>
      <ProjectFilter
        categories={getCategoryFacets(projects)}
        stackEntries={getStackFacets(projects)}
        value={filters}
        onChange={setFilters}
      />

      {hasPlaceholder ? (
        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Projects marked{" "}
          <span className="text-foreground">Example project</span> are seeded
          examples rather than client work, and are replaced before this site
          goes live.
        </p>
      ) : null}

      {/* Always rendered, so a screen reader has the region before the first
          change to announce into. It is the visible result count as well, which
          keeps one source of truth for what is on screen. */}
      <p
        role="status"
        aria-atomic="true"
        className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground"
      >
        {visible.length === 0
          ? "No projects match these filters."
          : `Showing ${visible.length} of ${projects.length} projects`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 text-base text-muted-foreground">
          Choose <span className="text-foreground">All</span> in either group
          above to widen the search.
        </p>
      ) : (
        /* Not wrapped in `Reveal`: re-animating the list on every filter press
           is noise, and it delays the result the press asked for. */
        <ul role="list" className="mt-8 grid gap-8 lg:grid-cols-2">
          {visible.map((project, index) => (
            <li key={project.slug}>
              {/* Only the first card preloads its cover. Next reported it as
                  the Largest Contentful Paint element on this route. On the
                  first paint no filter is active, so the first visible card is
                  the first card. */}
              <ProjectCard
                project={project}
                titleAs="h2"
                priority={index === 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
