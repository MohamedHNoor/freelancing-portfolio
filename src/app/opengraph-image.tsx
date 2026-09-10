import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og/OgCard";
import { getProfile, getServices } from "@/content";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";

/* The site card. Metadata files inherit down the route tree, so this is the
   image for every route that does not declare its own; only `/projects/[slug]`
   does. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* Describes the card, which is what a screen reader user gets instead of it.
   Not a copy of the page title: the title is already read out beside it. */
export const alt = `A dark title card for ${getProfile().name}, freelance software engineer, showing the tagline "${getProfile().headline}" above the two service tracks.`;

export default async function Image() {
  const profile = getProfile();
  const services = getServices();

  return new ImageResponse(
    (
      <OgCard eyebrow="Freelance software engineer">
        <div
          style={{
            display: "flex",
            fontSize: 68,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            maxWidth: 900,
          }}
        >
          {profile.headline}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
          {services.map((service) => (
            <div
              key={service.slug}
              style={{
                display: "flex",
                padding: "14px 24px",
                borderRadius: 14,
                border: `1px solid ${OG_COLORS.border}`,
                backgroundColor: OG_COLORS.card,
                fontSize: 24,
                color: OG_COLORS.foreground,
              }}
            >
              {service.name}
            </div>
          ))}
        </div>
      </OgCard>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
