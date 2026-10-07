import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Server Action arguments include passwords and email-link tokens.
  logging: {
    serverFunctions: false,
    incomingRequests: {
      ignore: [/^\/(?:api\/auth|login|forgot-password|reset-password|verify-email)(?:\/|\?|$)/],
    },
  },

  /* Applied to every path, static routes included. Deliberately here rather
     than in middleware: middleware would make every route dynamic, and this
     site's public routes remain statically generated. Vercel
     translates these into its own routing config at deploy time, and
     `next start` serves them locally, so both can be verified the same way.

     `next dev` sets NODE_ENV to "development" before loading this file, and
     gets a policy that also allows React's development-only `eval()`. A
     production build never matches, so what ships is unchanged. */
  async headers() {
    const headers = securityHeaders({
      development: process.env.NODE_ENV === "development",
    });
    return [
      {
        source: "/:path*",
        headers: headers.map(({ key, value }) => ({ key, value })),
      },
      // Protect email-link tokens even before page metadata has been parsed.
      ...["/login", "/forgot-password", "/reset-password", "/verify-email"].map(
        (source) => ({
          source,
          headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
        }),
      ),
    ];
  },
};

export default nextConfig;
