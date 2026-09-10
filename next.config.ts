import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /* Applied to every path, static routes included. Deliberately here rather
     than in middleware: middleware would make every route dynamic, and this
     site's contract is that all of them are statically generated. Vercel
     translates these into its own routing config at deploy time, and
     `next start` serves them locally, so both can be verified the same way. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
