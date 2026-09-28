import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /* Applied to every path, static routes included. Deliberately here rather
     than in middleware: middleware would make every route dynamic, and this
     site's contract is that all of them are statically generated. Vercel
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
    ];
  },
};

export default nextConfig;
