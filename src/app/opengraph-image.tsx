import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og/OgCard";
import { getProfile, getServices } from "@/content";
import { headlineLines } from "@/lib/headline";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";
import { SITE_CARD_ALT } from "@/lib/seo";

/* The site card. Only `/` picks this file up directly, because it shares the
   segment. Every other route sets its own `openGraph`, which replaces the one
   carrying this image, so `routeMetadata` attaches the card to each of them.
   Case studies override it with their own. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const alt = SITE_CARD_ALT;

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
