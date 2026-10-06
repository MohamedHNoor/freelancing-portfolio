import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enquiryHref } from "@/lib/links";
import { REPLY_TIME } from "@/lib/site";
import type { ProjectType } from "@/lib/validation/contact";

type CaseStudyCtaProps = {
  /** The project type to preselect, from the case study's service. */
  enquiryType?: ProjectType;
};

/* The end of a case study is the moment a reader is most convinced, so it
   offers one action rather than leaving them at the previous and next links. */
export function CaseStudyCta({ enquiryType }: CaseStudyCtaProps) {
  return (
    <section
      aria-labelledby="case-study-cta"
      className="mt-16 rounded-xl border border-border bg-card/60 p-6 sm:mt-20 sm:p-8"
    >
      <h2
        id="case-study-cta"
        className="font-heading text-2xl font-semibold tracking-tight"
      >
        Need something like this built?
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Tell me what you are building. You can send a brief, a Figma file or a
        short description, and you will get a reply {REPLY_TIME} with a
        practical way to approach it.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
          <Link href={enquiryHref(enquiryType)}>
            Start a Project
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 px-5 text-[0.95rem]">
          <Link href="/projects">View more work</Link>
        </Button>
      </div>
    </section>
  );
}
