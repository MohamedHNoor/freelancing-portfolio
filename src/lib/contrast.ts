/** WCAG contrast, computed from the theme tokens themselves.
 *
 *  Accessibility is one of the services this site sells, so contrast is a test
 *  rather than a judgement call made once by eye. The tokens are authored in
 *  `oklch`, which is perceptually uniform and pleasant to tune, but WCAG 2.x is
 *  defined on sRGB relative luminance, so a ratio can only be computed after
 *  converting. That conversion is the reason this file exists. */

export type Rgb = { r: number; g: number; b: number };

/** A parsed token value. `alpha` is 1 unless the value declared otherwise. */
export type TokenColor = Rgb & { alpha: number };

/** WCAG 2.1 AA: body text. */
export const AA_TEXT = 4.5;

/** WCAG 2.1 AA: large text and non-text UI boundaries such as a focus ring. */
export const AA_LARGE = 3;

const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/;

/** Converts one `oklch()` value to sRGB in 0-1, plus its alpha.
 *
 *  OKLCh to OKLab to linear sRGB to gamma-encoded sRGB, with the standard
 *  matrices. Channels are clamped, so a colour outside the sRGB gamut resolves
 *  to the nearest representable one, which is what a browser displays anyway. */
export function oklchToSrgb(value: string): TokenColor {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (match === null) {
    throw new RangeError(`Not an oklch() colour: ${JSON.stringify(value)}`);
  }

  const [, rawL, rawC, rawH, rawAlpha] = match;
  const L = rawL.endsWith("%") ? Number.parseFloat(rawL) / 100 : Number(rawL);
  const C = Number(rawC);
  const hue = (Number(rawH) * Math.PI) / 180;

  const a = C * Math.cos(hue);
  const bb = C * Math.sin(hue);

  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;

  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha: parseAlpha(rawAlpha),
  };
}

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) {
    return 1;
  }
  return raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw);
}

function encode(linear: number): number {
  const c = clamp(linear);
  const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return clamp(encoded);
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Composites a partly transparent colour over an opaque one.
 *
 *  Required, not cosmetic. The dark theme's `--border` is
 *  `oklch(1 0 0 / 12%)`: taken at face value that is pure white, which passes
 *  every threshold, while what a visitor actually sees is 12% white over a
 *  near-black background, which is far dimmer. Computing the ratio without this
 *  step produces a confidently wrong answer. */
export function compositeOver(color: TokenColor, background: Rgb): Rgb {
  const alpha = color.alpha;
  return {
    r: color.r * alpha + background.r * (1 - alpha),
    g: color.g * alpha + background.g * (1 - alpha),
    b: color.b * alpha + background.b * (1 - alpha),
  };
}

/** WCAG relative luminance from gamma-encoded sRGB. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function linearize(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** The WCAG contrast ratio between two colours, from 1 to 21. Order-independent. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ThemeTokens = Record<string, string>;

/** The raw token values declared in one CSS rule block.
 *
 *  Reads the stylesheet rather than a copy of the palette, so the test cannot
 *  drift away from what actually ships. If the block or its format changes
 *  enough that this stops matching, the test fails loudly instead of silently
 *  checking nothing. */
export function parseThemeTokens(css: string, selector: string): ThemeTokens {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`^${escaped}\\s*\\{([\\s\\S]*?)^\\}`, "m").exec(css);

  if (block === null) {
    throw new RangeError(`No rule block found for selector ${selector}`);
  }

  const tokens: ThemeTokens = {};
  for (const [, name, value] of block[1].matchAll(
    /^\s*--([a-z0-9-]+):\s*([^;]+);/gim,
  )) {
    tokens[name] = value.trim();
  }

  if (Object.keys(tokens).length === 0) {
    throw new RangeError(`No custom properties found in ${selector}`);
  }

  return tokens;
}

/** The measured contrast of one foreground token against one background token,
 *  compositing the foreground when it declares alpha. */
export function tokenContrast(
  tokens: ThemeTokens,
  foreground: string,
  background: string,
): number {
  const fg = readToken(tokens, foreground);
  const bg = readToken(tokens, background);

  if (bg.alpha !== 1) {
    throw new RangeError(
      `Background token --${background} is not opaque; a pair needs a solid backdrop`,
    );
  }

  return contrastRatio(compositeOver(fg, bg), bg);
}

function readToken(tokens: ThemeTokens, name: string): TokenColor {
  const value = tokens[name];
  if (value === undefined) {
    throw new RangeError(`No token --${name} in this theme`);
  }
  return oklchToSrgb(value);
}
