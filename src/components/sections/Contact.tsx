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
      /* Ordered the way a hesitant buyer decides, not the way a freelancer
         wants to talk.

         1. Name the artefact. "Send the design file" removes the blank page,
            which is the real reason most enquiries never get written.
         2. Reverse the risk. The fear when hiring someone with no review
            history is not a bad build, it is a wasted fortnight. A reply time
            and an offer to rule yourself out answer that for nothing.
         3. Scarcity last. Availability is true and earns its place, but it is
            about the seller, so it closes rather than opens.

         The one business day reply is a commitment, not a flourish, and it is
         repeated on /contact. It is achievable while availability reads "one
         build at a time"; if that changes, change this first. A promise kept
         beats a faster one broken, especially on a site whose whole argument is
         that its claims survive checking. */
      lead={`Send the design file, or a paragraph about the platform you need built. You get a reply within one business day, from me rather than a template, and if I am not the right fit I will say so instead of stringing it out. ${profile.availability.detail}`}
    >
      {/* Matches the hero's primary button. The low-commitment framing belongs in
          the lead above, which has already named what to send, promised a reply
          time and offered to rule me out; by the time a reader reaches the link
          the risk is gone and a short, confident verb reads better than a soft
          one. */}
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
