import type { ProfileLink, ProfileLinkKey } from "@/content";

export type ContactLink = {
  key: ProfileLinkKey;
  /** Ready for an `href`, scheme included. */
  href: string;
  /** What a reader sees, and what survives being printed on paper. */
  label: string;
};

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Turns a supplied profile link into something that both links and prints.
 *
 *  Tolerant about the scheme on purpose. Nothing consumes `getProfileLinks()`
 *  yet, so the content layer never settled whether `links.email` holds a bare
 *  address or a `mailto:` URL, and whether a web link carries `https://`. This
 *  accepts either rather than forcing that decision from a resume page: a value
 *  that already names a scheme is left exactly as it is, and one that does not
 *  gets the right one added.
 *
 *  The label is the address rather than a word like "GitHub". On screen the two
 *  read about the same; on paper the `href` is invisible, so a resume that says
 *  "GitHub" gives the reader nothing to type. */
export function toContactLink(link: ProfileLink): ContactLink {
  const value = link.href.trim();
  const hasScheme = SCHEME.test(value);

  if (link.key === "email") {
    const href = hasScheme ? value : `mailto:${value}`;
    return { key: link.key, href, label: stripScheme(href) };
  }

  const href = hasScheme ? value : `https://${value}`;
  return { key: link.key, href, label: stripScheme(href) };
}

/** Drops the scheme and any trailing slash, so `https://github.com/x/` reads as
 *  `github.com/x`. Only the leading scheme is removed; a colon later in the
 *  value, such as a port, survives. */
function stripScheme(value: string): string {
  const withoutScheme = value.replace(SCHEME, "").replace(/^\/\//, "");
  return withoutScheme.endsWith("/")
    ? withoutScheme.slice(0, -1)
    : withoutScheme;
}
