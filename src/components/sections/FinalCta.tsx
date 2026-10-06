import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Section } from "@/components/primitives/Section";
import { Button } from "@/components/ui/button";
import { getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";
import { REPLY_TIME } from "@/lib/site";

/* The last thing on the home page, and the end of the path it exists for: a
   visitor who has read this far is offered one action. The form itself is at
   `/contact`, so it lives on one URL. */
export function FinalCta() {
  const email = getProfileLinks().find((link) => link.key === "email");
  const direct = email === undefined ? undefined : toContactLink(email);

  return (
    <Section
      id="start"
      label="Start a project"
      heading="Let's Build Something Useful"
      lead={`Whether you're launching a new business, replacing a manual process, building a SaaS product, or turning a Figma design into a production website, I can help. Every enquiry gets a reply ${REPLY_TIME}.`}
      className="border-t border-border"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
          <Link href="/contact">
            Start a Project
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        {direct !== undefined ? (
          <p className="text-sm text-muted-foreground">
            Or email me at{" "}
            <a
              href={direct.href}
              className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {direct.label}
            </a>
          </p>
        ) : null}
      </div>
    </Section>
  );
}
