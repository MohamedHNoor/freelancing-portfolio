import { Reveal } from "@/components/primitives/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Point } from "@/types/content";

type PointGridProps = {
  points: readonly Point[];
  /** Grid columns from `lg`. Two suits four long entries, three suits more. */
  columns?: 2 | 3 | 4;
  /** Numbered when order carries meaning, as in a process. */
  numbered?: boolean;
};

const COLUMNS = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

/* A card per point, for the sections that list titled points: who the work is
   for, why to hire, and how a project runs. Each card is an `h3` under its
   section's `h2`. */
export function PointGrid({ points, columns = 2, numbered = false }: PointGridProps) {
  if (points.length === 0) {
    return null;
  }

  const List = numbered ? "ol" : "ul";

  return (
    <List role="list" className={cn("grid gap-6 sm:grid-cols-2", COLUMNS[columns])}>
      {points.map((point, index) => (
        <li key={point.title} className="min-w-0">
          <Reveal className="h-full">
            <Card className="h-full [--card-spacing:--spacing(6)]">
              <CardContent className="min-w-0">
                {numbered ? (
                  /* Decorative: an `ol` already announces position. */
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs tracking-[0.16em] text-brand"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : null}
                <h3
                  className={cn(
                    "font-heading text-lg font-semibold tracking-tight",
                    numbered && "mt-2",
                  )}
                >
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.detail}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </li>
      ))}
    </List>
  );
}
