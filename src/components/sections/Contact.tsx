import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { getProfile, getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";

/* The last thing on the page, and the only section whose job is a click rather
   than a read. The form itself is at `/contact`: putting it on two URLs would
   mean two analytics targets and a canonical decision for feature 11. */
export function Contact() {
  const profile = getProfile();
  const email = getProfileLinks().find((link) => link.key === "email");
  const direct = email === undefined ? undefined : toContactLink(email);

  return (
    <Section
      id="contact"
      label="Contact"
      heading="Tell me what you are building"
      lead={`${profile.availability.detail} Send a few lines about the project and the timeline, and you will get a real reply rather than a template.`}
    >
      <SectionLink href="/contact">Start a project</SectionLink>

      {direct !== undefined ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Or email me directly at{" "}
          <a
            href={direct.href}
            className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {direct.label}
          </a>
        </p>
      ) : null}
    </Section>
  );
}
