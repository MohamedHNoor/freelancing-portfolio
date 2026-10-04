import { PointGrid } from "@/components/primitives/PointGrid";
import { Section } from "@/components/primitives/Section";
import { getReasons } from "@/content";

export function Reasons() {
  return (
    <Section id="why" label="Why me" heading="Why Work With Me?">
      <PointGrid points={getReasons()} columns={4} />
    </Section>
  );
}
