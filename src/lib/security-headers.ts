/** Security response headers, served from `next.config.ts` for every path.
 *
 *  Kept here rather than inline in the config so the set is testable and so the
 *  reasoning below lives next to the values it explains. */

export type SecurityHeader = { key: string; value: string };

export type SecurityHeaderOptions = {
  /** True under `next dev` only. React's development build uses `eval()` to
   *  rebuild server error stacks in the browser, so the development policy
   *  allows it. React and Next never use `eval()` in a production build, and
   *  the production policy keeps refusing it. */
  development: boolean;
};

/* The two `'unsafe-inline'` allowances are the honest part of this policy, and
   they are deliberate rather than accidental.

   `script-src` needs it because the built HTML carries three inline scripts.
   Two are Next's own flight data (`self.__next_f.push(...)`), whose contents
   change every build, so hashing them is not maintainable. The third is the
   pre-paint theme script in `src/app/layout.tsx`, which exists precisely so a
   stored light preference never flashes dark, and which must run before paint.
   The documented alternative is a nonce, and Next generates nonces from
   middleware. Middleware makes every route dynamic, and the overview's contract
   is that every route is statically generated. Trading static rendering for a
   stricter script-src is not a trade this project should make silently.
 
   `style-src` needs it because two elements carry `style` attributes: the hero's
   radial glow, and the marquee track's pause state.
 
   So this is defence in depth, not immunity to XSS. It still blocks clickjacking
   (`frame-ancestors`), base-tag injection (`base-uri`), form hijacking
   (`form-action`), plugin content (`object-src`), and any fetch, image or font
   from an origin that is not this one. What it does not do is stop injected
   inline script, and nothing here should be read as claiming otherwise. The
   mitigating fact is that this site renders no user-submitted HTML: its one
   script sink is the JSON-LD in `src/components/seo/JsonLd.tsx`, which escapes
   `<` and is directly tested. */
function cspDirectives({
  development,
}: SecurityHeaderOptions): readonly string[] {
  return [
    "default-src 'self'",
    development
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    /* `data:` covers the inline SVG icon; `blob:` covers images Next may hand the
       document from a blob URL. */
    "img-src 'self' data: blob:",
    "font-src 'self'",
    /* Same-origin only. The contact Server Action posts back to this origin, and
       Resend is called from the server, never the browser. */
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
}

/** Takes the environment as a parameter rather than reading it, so both
 *  policies are testable without mutating `process.env`. */
export function contentSecurityPolicy(options: SecurityHeaderOptions): string {
  return cspDirectives(options).join("; ");
}

export function securityHeaders(
  options: SecurityHeaderOptions,
): readonly SecurityHeader[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    /* Two years, subdomains included, and preload-eligible. Vercel terminates TLS
       for custom domains, so this only ever hardens an already-HTTPS origin. */
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    /* Full URL to this origin, origin only when leaving it. Keeps the referring
       path off third-party servers without breaking same-site analytics later. */
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    /* Redundant with `frame-ancestors 'none'` for modern browsers, and still the
       only signal older ones understand. */
    { key: "X-Frame-Options", value: "DENY" },
    /* This site asks for none of these, so it declines them outright. */
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
  ];
}

/** The production policy: what `next build` bakes in and what ships. */
export const CONTENT_SECURITY_POLICY = contentSecurityPolicy({
  development: false,
});

export const SECURITY_HEADERS = securityHeaders({ development: false });
