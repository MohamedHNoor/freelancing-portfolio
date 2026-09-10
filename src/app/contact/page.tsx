import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHeader } from "@/components/primitives/PageHeader";
import { getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell me what you are building: a few questions about the project, the timeline, and how to reach you. Every enquiry gets an answer within one business day.",
  ...routeMetadata("/contact"),
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
          heading="Tell me what you are building"
          lead="The questions below exist so the first reply is useful rather than a request for more detail. Every enquiry gets an answer within one business day, and if it is not something I should take on I will tell you rather than string it out."
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
