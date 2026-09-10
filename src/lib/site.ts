export type NavItem = {
  label: string;
  href: string;
};

/* Site-level only. Person-level facts (name, bio, links, availability) live in
   the content layer; read them with `getProfile()` from `@/content`. */
export const SITE = {
  description:
    "Freelance software engineer turning Figma designs into fast, accessible Next.js sites, and building React and Node platforms for healthcare and fintech teams.",
} as const;

/** Where the site is assumed to run when `NEXT_PUBLIC_SITE_URL` is not
 *  configured. Only ever reached outside a production build. */
export const DEVELOPMENT_SITE_URL = "http://localhost:3000";

export type ResolveSiteUrlOptions = {
  /** True for a production build. A production build with a wrong origin is
   *  worse than no build: every canonical, sitemap entry and social image would
   *  point at a host that is not this site, and a search engine would act on it
   *  long before anyone noticed. */
  requireConfigured: boolean;
};

/** Normalizes the configured origin, or fails loudly when it cannot.
 *
 *  Accepts an `http:` or `https:` origin with no path beyond `/`, no query and
 *  no hash. The strictness is deliberate: everything downstream appends a route
 *  path to this value, so an origin that already carries `/en` or `?ref=x`
 *  produces canonicals that are subtly wrong rather than obviously broken.
 *
 *  Returns `url.origin`, which normalizes the case of the host and drops the
 *  trailing slash, so a value pasted from a browser address bar works.
 *
 *  Takes the raw value as a parameter rather than reading the environment
 *  itself, so every branch is testable without mutating `process.env`. This is
 *  the shape `assertContentInvariants` uses for the same reason. */
export function resolveSiteUrl(
  raw: string | undefined,
  { requireConfigured }: ResolveSiteUrlOptions,
): string {
  const value = raw?.trim() ?? "";

  if (value === "") {
    return fallbackOrThrow("is not set", requireConfigured);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fallbackOrThrow(`is not a URL: ${JSON.stringify(value)}`, requireConfigured);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fallbackOrThrow(
      `must be http or https, but is ${JSON.stringify(url.protocol)}`,
      requireConfigured,
    );
  }

  /* `new URL("https://example.com").pathname` is already "/", so this rejects a
     sub-path without also rejecting the bare origin. */
  if (url.pathname !== "/") {
    return fallbackOrThrow(
      `must be an origin with no path, but carries ${JSON.stringify(url.pathname)}`,
      requireConfigured,
    );
  }

  if (url.search !== "" || url.hash !== "") {
    return fallbackOrThrow(
      "must be an origin with no query string or fragment",
      requireConfigured,
    );
  }

  return url.origin;
}

function fallbackOrThrow(reason: string, requireConfigured: boolean): string {
  if (requireConfigured) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL ${reason}. Set it to the production origin, such as https://example.com, with no path, query string or trailing slash.`,
    );
  }
  return DEVELOPMENT_SITE_URL;
}

/* Read as a literal static member expression, never a computed lookup or a
   destructured `env`: that exact syntax is what Next replaces with the value at
   build time, and anything else resolves to `undefined` in the browser bundle.

   `NODE_ENV` decides how hard a missing value fails. `npm run build` sets it to
   "production", so a misconfigured deploy stops at the build instead of
   publishing canonicals pointing at localhost. `npm run dev` and `npm test` get
   the fallback and need no env file. */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, {
  requireConfigured: process.env.NODE_ENV === "production",
});

/** Joins an origin and a route path into one absolute URL.
 *
 *  Tolerant of a trailing slash on the origin so a caller passing a raw
 *  configured value cannot produce `https://example.com//about`. The site root
 *  resolves to the bare origin rather than `https://example.com/`, so the
 *  canonical for `/` matches the URL a visitor actually lands on. */
export function joinSiteUrl(origin: string, path: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;

  if (path === "" || path === "/") {
    return base;
  }

  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/** The absolute URL for a route path, against this build's configured origin. */
export function absoluteUrl(path: string): string {
  return joinSiteUrl(SITE_URL, path);
}

/* Every item is a route. Contact was the last anchor and the last dead link;
   feature 10 gave it a page.

   Each of these has a home section too, reachable by scrolling. The nav points
   at the pages because that is what a proposal links to directly, and because
   the page carries the full content while the section carries a summary.

   Route items are what `NavLink` can mark `aria-current="page"`; it treats
   anything containing `#` as an anchor and never marks it. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Experience", href: "/experience" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
];
