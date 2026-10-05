import type { ReactNode } from "react";
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
  /** One more cell after the points, such as a call to action that fills
   *  what would otherwise be an empty slot in the last row. */
  trailing?: ReactNode;
  /** Fade each card in on scroll. Off on content pages: `Reveal`
   *  server-renders `opacity: 0`, which would make the content depend on
   *  JavaScript having run. */
  reveal?: boolean;
};

const COLUMNS = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

/* A card per point, for the sections that list titled points: who the work is
   for, why to hire, and how a project runs. Each card is an `h3`, so the grid
   must sit under an `h2`. */
export function PointGrid({
  points,
  columns = 2,
  numbered = false,
  trailing,
  reveal = true,
}: PointGridProps) {
  if (points.length === 0) {
    return null;
  }

  const List = numbered ? "ol" : "ul";

  return (
    <List role="list" className={cn("grid gap-6 sm:grid-cols-2", COLUMNS[columns])}>
      {points.map((point, index) => {
        const card = (
          <PointCard point={point} position={numbered ? index + 1 : undefined} />
        );

        return (
          <li key={point.title} className="min-w-0">
            {reveal ? <Reveal className="h-full">{card}</Reveal> : card}
          </li>
        );
      })}
      {trailing !== undefined ? <li className="min-w-0">{trailing}</li> : null}
    </List>
  );
}

function PointCard({ point, position }: { point: Point; position?: number }) {
  return (
    <Card className="h-full [--card-spacing:--spacing(6)]">
      <CardContent className="min-w-0">
        {position !== undefined ? (
          /* Decorative: an `ol` already announces position. */
          <span
            aria-hidden="true"
            className="font-mono text-xs tracking-[0.16em] text-brand"
          >
            {String(position).padStart(2, "0")}
          </span>
        ) : null}
        <h3
          className={cn(
            "font-heading text-lg font-semibold tracking-tight",
            position !== undefined && "mt-2",
          )}
        >
          {point.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {point.detail}
        </p>
      </CardContent>
    </Card>
  );
}
