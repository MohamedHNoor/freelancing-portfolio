import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og/OgCard";
import { getProfile, getServices } from "@/content";
import { headlineLines } from "@/lib/headline";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";

/* The site card. Metadata files inherit down the route tree, so this is the
   image for every route that does not declare its own; only `/projects/[slug]`
   does. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* Describes the card, which is what a screen reader user gets instead of it.
   Not a copy of the page title: the title is already read out beside it. */
export const alt = `A dark title card for ${getProfile().name}, ${getProfile().role.toLowerCase()} in Wellington, New Zealand, showing the tagline "${getProfile().headline}" above the four services.`;

export default async function Image() {
  const profile = getProfile();
  const services = getServices();

  return new ImageResponse(
    (
      <OgCard eyebrow={profile.role}>
        {/* A line per sentence, as in the hero. Satori only lays out several
            children inside a flex container, hence the column. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 60,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            maxWidth: 900,
          }}
        >
          {headlineLines(profile.headline).map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
          {services.map((service) => (
            <div
              key={service.slug}
              style={{
                display: "flex",
                padding: "12px 20px",
                borderRadius: 14,
                border: `1px solid ${OG_COLORS.border}`,
                backgroundColor: OG_COLORS.card,
                fontSize: 22,
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
