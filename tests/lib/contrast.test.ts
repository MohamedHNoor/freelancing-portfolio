import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AA_LARGE,
  AA_TEXT,
  compositeOver,
  contrastRatio,
  oklchToSrgb,
  parseThemeTokens,
  relativeLuminance,
  tokenContrast,
} from "@/lib/contrast";

const css = readFileSync(
  fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)),
  "utf8",
);

const THEMES = [
  ["light", parseThemeTokens(css, ":root")],
  ["dark", parseThemeTokens(css, ".dark")],
] as const;

/** Every pair the site actually renders, with the threshold that applies.
 *  4.5 is AA body text; 3 is AA for large text and non-text UI boundaries. */
const PAIRS: readonly (readonly [string, string, number])[] = [
  ["foreground", "background", AA_TEXT],
  ["foreground", "card", AA_TEXT],
  ["card-foreground", "card", AA_TEXT],
  ["muted-foreground", "background", AA_TEXT],
  ["muted-foreground", "card", AA_TEXT],
  ["brand", "background", AA_TEXT],
  ["brand", "card", AA_TEXT],
  ["primary-foreground", "primary", AA_TEXT],
  ["secondary-foreground", "secondary", AA_TEXT],
  ["accent-foreground", "accent", AA_TEXT],
  ["destructive", "background", AA_TEXT],
  ["ring", "background", AA_LARGE],
  ["input", "background", AA_LARGE],
];

/* `--border` is deliberately not in that table.
 *
 *  WCAG 2.1 SC 1.4.11 requires 3:1 for visual information needed to identify a
 *  user interface component or its state, and for graphical objects needed to
 *  understand content. Every use of `--border` in this codebase is neither: it
 *  draws section rules, card outlines, the header and footer rules, the resume's
 *  heading underlines, and the pill chips. Remove any one of them and the
 *  content is still identifiable and still understandable.
 *
 *  The two tokens that do carry that duty are asserted above. Controls take
 *  their boundary from `--input` (`input`, `textarea`, and the outline button
 *  variant all use `border-input`) and their focus state from `--ring`. The one
 *  interactive element drawn with `--border`, the case study previous/next card,
 *  is identified by its link text and shows its states through `--ring` on focus
 *  and a foreground-tinted border on hover.
 *
 *  Holding a decorative rule to 3:1 would put a hard, near-white line around
 *  every card in both themes. That is a redesign, not an accessibility fix, and
 *  it is what this feature's spec rules out. */

describe("oklchToSrgb", () => {
  it("converts pure white and pure black", () => {
    const white = oklchToSrgb("oklch(1 0 0)");
    expect(white.r).toBeCloseTo(1, 6);
    expect(white.g).toBeCloseTo(1, 6);
    expect(white.b).toBeCloseTo(1, 6);
    expect(white.alpha).toBe(1);

    const black = oklchToSrgb("oklch(0 0 0)");
    expect(black.r).toBeCloseTo(0, 6);
    expect(black.g).toBeCloseTo(0, 6);
    expect(black.b).toBeCloseTo(0, 6);
  });

  it("reads a percentage alpha", () => {
    expect(oklchToSrgb("oklch(1 0 0 / 12%)").alpha).toBeCloseTo(0.12, 5);
  });

  it("reads a decimal alpha", () => {
    expect(oklchToSrgb("oklch(1 0 0 / 0.5)").alpha).toBeCloseTo(0.5, 5);
  });

  it("defaults alpha to opaque", () => {
    expect(oklchToSrgb("oklch(0.5 0.2 288)").alpha).toBe(1);
  });

  it("rejects a value that is not oklch", () => {
    expect(() => oklchToSrgb("#ffffff")).toThrow(/oklch/);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(
      contrastRatio({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 }),
    ).toBeCloseTo(21, 5);
  });

  it("is 1:1 for a colour against itself", () => {
    const grey = { r: 0.5, g: 0.5, b: 0.5 };
    expect(contrastRatio(grey, grey)).toBeCloseTo(1, 10);
  });

  it("does not depend on argument order", () => {
    const a = { r: 0.1, g: 0.2, b: 0.9 };
    const b = { r: 0.95, g: 0.9, b: 0.4 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe("relativeLuminance", () => {
  it("spans 0 to 1 for black and white", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 10);
    expect(relativeLuminance({ r: 1, g: 1, b: 1 })).toBeCloseTo(1, 10);
  });
});

describe("compositeOver", () => {
  it("returns the foreground when it is opaque", () => {
    const fg = { r: 0.2, g: 0.4, b: 0.6, alpha: 1 };
    expect(compositeOver(fg, { r: 1, g: 1, b: 1 })).toEqual({
      r: 0.2,
      g: 0.4,
      b: 0.6,
    });
  });

  it("returns the background when the foreground is fully transparent", () => {
    const fg = { r: 1, g: 1, b: 1, alpha: 0 };
    expect(compositeOver(fg, { r: 0.1, g: 0.1, b: 0.1 })).toEqual({
      r: 0.1,
      g: 0.1,
      b: 0.1,
    });
  });

  /* The case that makes this function necessary: 12% white over near-black is
     not white, and treating it as white would pass a boundary that in reality
     is barely visible. */
  it("darkens a low-alpha white over a dark backdrop", () => {
    const border = { r: 1, g: 1, b: 1, alpha: 0.12 };
    const composited = compositeOver(border, { r: 0.05, g: 0.05, b: 0.07 });
    expect(composited.r).toBeLessThan(0.2);
    expect(contrastRatio(composited, { r: 0.05, g: 0.05, b: 0.07 })).toBeLessThan(2);
  });
});

describe("parseThemeTokens", () => {
  it("reads both theme blocks from the real stylesheet", () => {
    for (const [, tokens] of THEMES) {
      expect(tokens.background).toMatch(/^oklch\(/);
      expect(tokens.foreground).toMatch(/^oklch\(/);
    }
  });

  it("throws rather than silently checking nothing when a block is missing", () => {
    expect(() => parseThemeTokens(css, ".no-such-theme")).toThrow(/No rule block/);
  });
});

describe.each(THEMES)("%s theme meets WCAG AA", (_name, tokens) => {
  it.each(PAIRS)(
    "--%s on --%s reaches %s:1",
    (foreground, background, threshold) => {
      expect(
        tokenContrast(tokens, foreground, background),
      ).toBeGreaterThanOrEqual(threshold);
    },
  );
});
