import { PointGrid } from "@/components/primitives/PointGrid";
import { Section } from "@/components/primitives/Section";
import { getAudiences } from "@/content";

export function Audiences() {
  return (
    <Section id="who" label="Clients" heading="Who I Work With">
      <PointGrid points={getAudiences()} columns={4} />
    </Section>
  );
}
