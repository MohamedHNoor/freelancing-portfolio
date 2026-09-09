import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SectionLinkProps = {
  href: string;
  children: ReactNode;
};

/** The link out of a home section to the page carrying its full content.
 *
 *  Extracted from the Projects section, which had this markup inline from
 *  feature 6 and is now one of five callers. One component means the five never
 *  drift into five slightly different buttons. */
export function SectionLink({ href, children }: SectionLinkProps) {
  return (
    <div className="mt-10">
      <Button
        asChild
        variant="outline"
        className="h-11 gap-2 px-5 text-[0.95rem]"
      >
        <Link href={href}>
          {children}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
