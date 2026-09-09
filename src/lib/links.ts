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

/** Builds an RFC 5322 `From` value that shows a person's name while sending from
 *  an address the sender actually controls.
 *
 *  The address is never the visitor's. A provider will only send from a domain
 *  you have verified, and forging someone else's address fails SPF, DKIM and
 *  DMARC even when a provider lets it through. The visitor's address belongs in
 *  `replyTo`, which is what makes Reply work.
 *
 *  The display name is user-controlled text landing in a mail header, so it is
 *  quoted rather than trusted bare. An earlier version enumerated the dangerous
 *  characters instead and missed the one that matters most: a `From` is a
 *  `mailbox-list`, and `,` is what separates one mailbox from the next. Bare,
 *  `Lovelace, Ada <hi@example.com>` is two mailboxes, and so is
 *  `x@attacker.test, Ada <hi@example.com>`. The first is an ordinary person
 *  writing their surname first; the second is an attacker putting their own
 *  address ahead of ours.
 *
 *  Quoting fixes the whole class rather than one character, because a
 *  quoted-string may legitimately contain `,`, `:` and `@`. Only `"` and `\`
 *  can break out of it, and both are already removed below, along with `<`, `>`
 *  and anything under 0x20. `<` and `>` are legal inside quotes but are stripped
 *  anyway, so a lenient parser has nothing to misread either.
 *
 *  Replaced with a space rather than deleted, so `Ada\r\nBcc: x` reads as
 *  `Ada Bcc: x` instead of running the words together. Runs of whitespace
 *  collapse, and a name left empty by that pass falls back to the bare address.
 *
 *  Known limit: a non-ASCII display name is passed through as UTF-8 rather than
 *  encoded per RFC 2047. That is unchanged by the quoting and is the provider's
 *  to handle. */
export function formatFromHeader(name: string, address: string): string {
  const display = name
    .replace(/[\u0000-\u001F\u007F"\\<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return display === "" ? address : `"${display}" <${address}>`;
}
