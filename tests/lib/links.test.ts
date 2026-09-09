import { describe, expect, it } from "vitest";
import { toContactLink } from "@/lib/links";
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
