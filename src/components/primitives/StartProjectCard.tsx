import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PRIMARY_CTA } from "@/lib/site";

/* The call to action that fills the last cell of a `PointGrid` whose points
   leave the final row one short, so the row ends on an action rather than an
   empty slot. */
export function StartProjectCard() {
  return (
    <Card className="h-full border-brand/40 bg-brand/5 [--card-spacing:--spacing(6)]">
      <CardContent className="flex h-full min-w-0 flex-col">
        <p className="font-heading text-lg font-semibold tracking-tight">
          Ready when you are
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tell me what you are building and get a reply within one business day.
        </p>
        <div className="mt-auto pt-5">
          <Button asChild className="h-10 gap-2 px-4">
            <Link href={PRIMARY_CTA.href}>
              {PRIMARY_CTA.label}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
