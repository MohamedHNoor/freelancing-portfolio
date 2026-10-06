import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHeader } from "@/components/primitives/PageHeader";
import { getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";
import { REPLY_TIME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    `Start a website or web application project with Mohamed Noor, a full-stack developer in Wellington, New Zealand. Every enquiry gets a reply ${REPLY_TIME}.`,
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
          heading="Have a Project in Mind?"
          lead={`Tell me what you're building. Send a project brief, a Figma file, an existing website or a requirements document, or simply explain the idea. I'll review it and suggest a practical way to approach the project, ${REPLY_TIME}.`}
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
            Rather email me?{" "}
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
