import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { getAuthEnv } from "@/lib/env";

/* The SDK caches session data in a signed cookie for `sessionDataTtl`, so a
   revoked session can pass `getSession()` for up to a minute. Its own console
   logging is off; callers log error codes only. */
function createAuth() {
  const { baseUrl, cookieSecret } = getAuthEnv();
  return createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret, sessionDataTtl: 60 },
    logLevel: "silent",
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  return auth ??= createAuth();
}
