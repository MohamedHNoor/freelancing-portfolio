import { Section } from "@/components/primitives/Section";
import { getProfile } from "@/content";

/* Local relevance for New Zealand and Australian clients. The owner works with
   clients across all three regions, so the copy states it as current work; it
   names no client or location it cannot back up. */
export function Location() {
  const profile = getProfile();

  return (
    <Section
      id="location"
      label="Location"
      heading="Based in New Zealand. Working Globally."
      lead="I'm based in Wellington and work with businesses, startups and agencies across New Zealand, Australia and internationally."
    >
      <ul role="list" className="flex flex-wrap gap-2">
        {profile.serviceArea.map((area) => (
          <li
            key={area}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm"
          >
            {area}
          </li>
        ))}
      </ul>
    </Section>
  );
}
