import { describe, expect, it } from "vitest";
import { formatFromHeader, toContactLink } from "@/lib/links";
import type { ProfileLink } from "@/content";

const email = (href: string): ProfileLink => ({ key: "email", href });
const github = (href: string): ProfileLink => ({ key: "github", href });

describe("toContactLink scheme handling", () => {
  it("adds mailto: to a bare address", () => {
    expect(toContactLink(email("a@b.com")).href).toBe("mailto:a@b.com");
  });

  it("leaves an address that already carries mailto: alone", () => {
    expect(toContactLink(email("mailto:a@b.com")).href).toBe("mailto:a@b.com");
  });

  it("adds https:// to a bare web link", () => {
    expect(toContactLink(github("github.com/x")).href).toBe(
      "https://github.com/x",
    );
  });

  it("leaves an https link alone", () => {
    expect(toContactLink(github("https://github.com/x")).href).toBe(
      "https://github.com/x",
    );
  });

  /* Not silently upgraded. If the content says http, that is what is linked;
     rewriting it here would hide a mistake rather than surface it. */
  it("keeps http:// rather than upgrading it", () => {
    expect(toContactLink(github("http://github.com/x")).href).toBe(
      "http://github.com/x",
    );
  });

  it("recognises an uppercase scheme and does not double it", () => {
    expect(toContactLink(github("HTTPS://github.com/x")).href).toBe(
      "HTTPS://github.com/x",
    );
  });

  it("ignores surrounding whitespace", () => {
    expect(toContactLink(email("  a@b.com  ")).href).toBe("mailto:a@b.com");
  });
});

describe("toContactLink labels", () => {
  it("drops the scheme from a web link", () => {
    expect(toContactLink(github("https://github.com/x")).label).toBe(
      "github.com/x",
    );
  });

  it("drops a trailing slash", () => {
    expect(toContactLink(github("https://github.com/x/")).label).toBe(
      "github.com/x",
    );
  });

  it("labels a mailto address as the address", () => {
    expect(toContactLink(email("mailto:a@b.com")).label).toBe("a@b.com");
  });

  it("labels a bare email as itself", () => {
    expect(toContactLink(email("a@b.com")).label).toBe("a@b.com");
  });

  it("never leaves a scheme in the label", () => {
    for (const link of [
      github("https://linkedin.com/in/x"),
      github("http://example.com"),
      github("example.com"),
      email("a@b.com"),
      email("mailto:a@b.com"),
    ]) {
      expect(toContactLink(link).label).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
    }
  });

  /* A colon after the host is part of the address, not a scheme, so only the
     leading one is removed. */
  it("keeps a port in the label", () => {
    expect(toContactLink(github("https://example.com:8443/x")).label).toBe(
      "example.com:8443/x",
    );
  });

  it("carries the key through unchanged", () => {
    expect(toContactLink(github("github.com/x")).key).toBe("github");
  });
});

describe("formatFromHeader", () => {
  it("shows the name while keeping the controlled address", () => {
    expect(formatFromHeader("Ada Lovelace", "hi@example.com")).toBe(
      '"Ada Lovelace" <hi@example.com>',
    );
  });

  /* The whole point: the visitor's address never becomes the sender. */
  it("never substitutes the name for the address", () => {
    expect(formatFromHeader("ada@gmail.com", "hi@example.com")).toContain(
      "<hi@example.com>",
    );
  });

  it.each([
    ['a quote', 'Ada "The First" Lovelace', '"Ada The First Lovelace" <hi@example.com>'],
    ["a backslash", "Ada\\Lovelace", '"Ada Lovelace" <hi@example.com>'],
    ["angle brackets", "Ada <evil@attacker.test>", '"Ada evil@attacker.test" <hi@example.com>'],
    ["a newline", "Ada\r\nBcc: evil@attacker.test", '"Ada Bcc: evil@attacker.test" <hi@example.com>'],
  ])("strips %s from the display name", (_label, input, expected) => {
    expect(formatFromHeader(input, "hi@example.com")).toBe(expected);
  });

  /* Counting `<` was the original bug in this test, and it let a real defect
     through for a whole feature. `Lovelace, Ada <hi@example.com>` has exactly
     one pair of angle brackets and two mailboxes, because a `From` is a
     `mailbox-list` and `,` is its separator. So the assertion has to be that the
     entire value is one mailbox, not that one address appears somewhere in it. */
  const ONE_MAILBOX = /^"[^"\\]*" <[^<>@\s]+@[^<>@\s]+>$/;

  it.each([
    ["stacked angle brackets", "Ada <a@b.test> <c@d.test>"],
    ["a surname-first name", "Lovelace, Ada"],
    ["an injected leading address", "x@attacker.test, Ada"],
    ["a trailing separator", "Ada,"],
    ["a semicolon and colon", "Ada; Bcc: evil@attacker.test"],
  ])("leaves exactly one mailbox in the header given %s", (_label, input) => {
    expect(formatFromHeader(input, "hi@example.com")).toMatch(ONE_MAILBOX);
  });

  it("keeps a comma inside the display name rather than dropping it", () => {
    expect(formatFromHeader("Lovelace, Ada", "hi@example.com")).toBe(
      '"Lovelace, Ada" <hi@example.com>',
    );
  });

  it("falls back to the bare address when nothing survives sanitising", () => {
    expect(formatFromHeader('"""', "hi@example.com")).toBe("hi@example.com");
    expect(formatFromHeader("   ", "hi@example.com")).toBe("hi@example.com");
  });
});
