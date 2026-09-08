import type {
  Metric,
  Project,
  ProjectCover,
  Service,
  ServiceSlug,
} from "@/types/content";

/** What a project card renders.
 *
 *  Deliberately not `Project`: `caseStudy` and `links` are dropped so the
 *  `/projects` filter, which is a client component, does not drag every case
 *  study into the client payload just to decide which cards to show. */
export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  period: string;
  category: ServiceSlug;
  /** The matching service's `name`, resolved on the server. */
  categoryLabel: string;
  stack: readonly string[];
  isPlaceholder: boolean;
  cover: ProjectCover;
  metrics: readonly Metric[];
};

export type CategoryFacet = {
  slug: ServiceSlug;
  label: string;
};

/** `null` means "any" in both fields. */
export type ProjectFilterState = {
  category: ServiceSlug | null;
  stack: string | null;
};

/** `assertContentInvariants` already guarantees every project's category has a
 *  matching service, so the throw here is for fixtures and for a future content
 *  edit that somehow gets past that gate. Failing loudly beats rendering a card
 *  labelled with an empty string. */
export function toProjectCardData(
  project: Project,
  services: readonly Service[],
): ProjectCardData {
  const service = services.find(
    (candidate) => candidate.slug === project.category,
  );
  if (service === undefined) {
    throw new RangeError(
      `Project "${project.slug}" has category "${project.category}" with no matching service`,
    );
  }

  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    period: project.period,
    category: project.category,
    categoryLabel: service.name,
    stack: project.stack,
    isPlaceholder: project.isPlaceholder,
    cover: project.cover,
    metrics: project.metrics,
  };
}

/** Each distinct category once, in first-appearance order. `projects.ts`
 *  declares its array order canonical for the whole site, so deriving the facet
 *  order from it avoids inventing a second ordering rule. */
export function getCategoryFacets(
  cards: readonly ProjectCardData[],
): readonly CategoryFacet[] {
  const bySlug = new Map<ServiceSlug, CategoryFacet>();
  for (const card of cards) {
    if (!bySlug.has(card.category)) {
      bySlug.set(card.category, {
        slug: card.category,
        label: card.categoryLabel,
      });
    }
  }
  return [...bySlug.values()];
}

/** Each distinct stack entry once, ordered by plain string comparison.
 *
 *  Not `localeCompare`: `Intl` resolves its collation from the environment, so
 *  the build machine and the browser can disagree, which is both a hydration
 *  mismatch and a test that only passes where it was written. `src/lib/dates.ts`
 *  documents the same trap for month names.
 *
 *  Code unit order puts every uppercase letter ahead of every lowercase one.
 *  Every entry in the current content starts uppercase, so the row reads
 *  alphabetically; a later lowercase entry such as "eslint" would sort last. */
export function getStackFacets(
  cards: readonly ProjectCardData[],
): readonly string[] {
  const seen = new Set<string>();
  for (const card of cards) {
    for (const entry of card.stack) {
      seen.add(entry);
    }
  }

  return [...seen].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

/** Cards matching every active filter, in input order. A `null` field matches
 *  everything, so an empty result means the combination genuinely has no
 *  projects rather than that a filter was left unset. */
export function filterProjects(
  cards: readonly ProjectCardData[],
  filters: ProjectFilterState,
): readonly ProjectCardData[] {
  return cards.filter((card) => {
    if (filters.category !== null && card.category !== filters.category) {
      return false;
    }
    if (filters.stack !== null && !card.stack.includes(filters.stack)) {
      return false;
    }
    return true;
  });
}
