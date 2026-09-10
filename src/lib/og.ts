import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The Open Graph and Twitter large-card size. Every consumer crops to roughly
 *  1.91:1, which this is. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_CONTENT_TYPE = "image/png";

/** The card palette, as literal hex.
 *
 *  These are the dark-theme tokens from `src/app/globals.css`, converted once.
 *  They cannot be referenced as tokens: `ImageResponse` renders through satori,
 *  which is not a browser and resolves neither `oklch()`, CSS custom properties,
 *  nor Tailwind v4 theme values. A token left unconverted renders as
 *  transparent, not as an error, so the mapping is written down here.
 *
 *  If a theme token changes, reconvert the matching value. */
export const OG_COLORS = {
  /** `--background`, oklch(0.145 0.018 285) */
  background: "#090911",
  /** `--card`, oklch(0.19 0.022 285) */
  card: "#13121d",
  /** `--foreground`, oklch(0.97 0.008 285) */
  foreground: "#f4f4fa",
  /** `--muted-foreground`, oklch(0.72 0.02 285) */
  muted: "#a3a3b1",
  /** `--brand`, oklch(0.78 0.14 288) */
  brand: "#b3a8ff",
  /** `--accent`, oklch(0.28 0.04 288) */
  accent: "#28263c",
  /** `--border`, oklch(1 0 0 / 12%) */
  border: "rgba(255, 255, 255, 0.12)",
  /** `--logo-from` and `--logo-to`, already literal hex in `src/app/icon.svg` */
  logoFrom: "#a78eff",
  logoTo: "#53a3f2",
} as const;

export const OG_FONT_FAMILY = "Space Grotesk";

let brandFont: Buffer | undefined;

/** The display face, read from disk and held for the life of the process.
 *
 *  `next/font` does not reach inside `ImageResponse`, so the file has to be
 *  loaded directly. Read lazily rather than at module scope: a top-level await
 *  here would run for anything that imported this module, including the
 *  palette. */
export async function loadBrandFont(): Promise<Buffer> {
  brandFont ??= await readFile(
    join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.ttf"),
  );
  return brandFont;
}

/** The `fonts` option for `ImageResponse`. One weight: the card is display type
 *  throughout, and a second file would be carried for a few small lines. */
export async function ogFonts() {
  return [
    {
      name: OG_FONT_FAMILY,
      data: await loadBrandFont(),
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
}
