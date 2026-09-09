import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHeader } from "@/components/primitives/PageHeader";
import { getProfile, getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";

export const metadata: Metadata = {
  title: `Contact - ${getProfile().name}`,
  description:
    "Start a project: a few questions about what you are building, the timeline, and how to reach you.",
};

export default function ContactPage() {
  const email = getProfileLinks().find((link) => link.key === "email");
  const direct = email === undefined ? undefined : toContactLink(email);

  return (
    <section
      aria-labelledby="contact-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="contact-heading"
          eyebrow="Contact"
          heading="Start a project"
          lead="A few questions so the first reply is useful rather than a request for more detail. I answer every enquiry."
        />

        <div className="mt-12">
          <ContactForm />
        </div>

        {/* The fallback for when delivery is misconfigured or fails. It renders
            only when an address is supplied, and one is: `profile.links.email`
            now carries a real address, so a visitor who hits the fail-closed
            path still has a way to reach a human. The guard stays because an
            empty value must render nothing rather than a dead `mailto:`. */}
        {direct !== undefined ? (
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Rather not use a form?{" "}
            <a
              href={direct.href}
              className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {direct.label}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
