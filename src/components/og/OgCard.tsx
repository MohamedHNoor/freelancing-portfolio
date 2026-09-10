import { getProfile } from "@/content";
import { OG_COLORS, OG_FONT_FAMILY } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/* Rendered by satori inside `ImageResponse`, never by a browser. Three rules
   follow from that and apply to everything below:

   - Inline styles only. No Tailwind classes, no CSS variables, no `oklch()`.
   - Every element holding more than one child needs an explicit `display:
     flex`. satori does not default to block layout, and a missing declaration
     silently stacks children on top of each other.
   - Raw text needs an element around it. A bare string beside an element is
     laid out unpredictably. */

export type OgCardProps = {
  /** Sits opposite the name in the header. The service track, or the kind of
   *  page this is. */
  eyebrow: string;
  /** Optional second marker beside the eyebrow, such as the placeholder flag. */
  badge?: string;
  children: React.ReactNode;
};

/** The shared frame: brand bar, header, a centred body, and the site's host.
 *
 *  Every card on this site is built from it, so the site card and a case study
 *  card cannot drift into looking like two different sites. */
export function OgCard({ eyebrow, badge, children }: OgCardProps) {
  const profile = getProfile();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: OG_COLORS.background,
        backgroundImage: `linear-gradient(135deg, ${OG_COLORS.background} 0%, ${OG_COLORS.card} 58%, ${OG_COLORS.accent} 100%)`,
        color: OG_COLORS.foreground,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      {/* The same violet-to-blue split the logo mark uses, as a rule across the
          top. It is what makes the card recognisable at thumbnail size, where
          the type is too small to read. */}
      <div
        style={{
          display: "flex",
          height: 10,
          backgroundImage: `linear-gradient(90deg, ${OG_COLORS.logoFrom}, ${OG_COLORS.logoTo})`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "56px 72px 52px 72px",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <Mark />
          <div style={{ display: "flex", fontSize: 30 }}>{profile.name}</div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {badge === undefined ? null : <Pill label={badge} tone="warn" />}
            <Pill label={eyebrow} tone="brand" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            color: OG_COLORS.muted,
          }}
        >
          {/* The host, not the full origin: it is a wordmark here, not a link. */}
          <div style={{ display: "flex" }}>{new URL(SITE_URL).host}</div>
        </div>
      </div>
    </div>
  );
}

/** The logo mark as a tile. The site draws its split M with two clipped paths,
 *  which satori does not reproduce reliably, so the same two brand colours are
 *  carried as a gradient behind the letterform instead. */
function Mark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundImage: `linear-gradient(135deg, ${OG_COLORS.logoFrom}, ${OG_COLORS.logoTo})`,
        color: OG_COLORS.background,
        fontSize: 36,
      }}
    >
      M
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: "brand" | "warn" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        borderRadius: 999,
        border: `1px solid ${tone === "brand" ? OG_COLORS.border : OG_COLORS.muted}`,
        fontSize: 22,
        color: tone === "brand" ? OG_COLORS.brand : OG_COLORS.muted,
      }}
    >
      {label}
    </div>
  );
}
