import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("auth page response headers", () => {
  it("preserves the global security policy", async () => {
    const rules = await nextConfig.headers?.();
    const global = rules?.find((rule) => rule.source === "/:path*");
    expect(global?.headers.some(({ key, value }) =>
      key === "Content-Security-Policy" && value.length > 0,
    )).toBe(true);
  });

  it.each(["/login", "/forgot-password", "/reset-password", "/verify-email"])(
    "prevents referrer disclosure from %s, overriding the global policy",
    async (path) => {
      const rules = await nextConfig.headers?.();
      const globalIndex = rules?.findIndex((rule) => rule.source === "/:path*");
      const privateIndex = rules?.findIndex((rule) => rule.source === path);
      expect(privateIndex).toBeGreaterThan(globalIndex ?? -1);
      expect(rules?.find((rule) => rule.source === path)?.headers).toContainEqual({
        key: "Referrer-Policy",
        value: "no-referrer",
      });
    },
  );
});

describe("auth request log privacy", () => {
  const logging = nextConfig.logging && nextConfig.logging.incomingRequests;
  const ignoredPaths = typeof logging === "object" ? logging.ignore ?? [] : [];

  it.each([
    "/login",
    "/forgot-password",
    "/reset-password?token=fixture",
    "/verify-email?token=fixture",
    "/api/auth/verify-email?token=fixture",
  ])("suppresses sensitive auth request URLs for %s", (path) => {
    expect(ignoredPaths.some((pattern) => pattern.test(path))).toBe(true);
  });

  it.each(["/", "/contact", "/projects", "/reset-password-guide", "/api/authors"])(
    "preserves ordinary request logging for %s",
    (path) => {
      expect(ignoredPaths.some((pattern) => pattern.test(path))).toBe(false);
    },
  );
});
