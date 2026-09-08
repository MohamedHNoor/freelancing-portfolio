import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { AdjacentProjects } from "@/content";

type CaseStudyNavProps = {
  adjacent: AdjacentProjects;
};

const LINK_CLASS =
  "group block rounded-lg border border-border p-5 transition-colors hover:border-foreground/25 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* `getAdjacentProjects` does not wrap around, so the first and last project
   each have one direction only. Each side is placed in its own grid column
   explicitly rather than relying on source order, so a lone `next` stays on the
   right instead of sliding into the empty `previous` slot. */
export function CaseStudyNav({ adjacent }: CaseStudyNavProps) {
  const { previous, next } = adjacent;

  if (previous === undefined && next === undefined) {
    return null;
  }

  return (
    <nav
      aria-label="More case studies"
      className="mt-16 border-t border-border pt-8 sm:mt-20"
    >
      <ul role="list" className="grid gap-4 sm:grid-cols-2">
        {previous !== undefined ? (
          <li className="sm:col-start-1">
            <Link href={`/projects/${previous.slug}`} className={LINK_CLASS}>
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                Previous
              </span>
              <span className="mt-2.5 block font-heading text-base font-semibold tracking-tight">
                {previous.title}
              </span>
            </Link>
          </li>
        ) : null}

        {next !== undefined ? (
          <li className="sm:col-start-2">
            <Link href={`/projects/${next.slug}`} className={LINK_CLASS}>
              <span className="flex items-center justify-end gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Next
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-2.5 block text-right font-heading text-base font-semibold tracking-tight">
                {next.title}
              </span>
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
