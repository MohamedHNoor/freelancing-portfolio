import "server-only";
import { headers } from "next/headers";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import {
  createAuthServer,
  extractNeonAuthCookies,
  resolveNeonAuthLogging,
  type RequestContext,
} from "@neondatabase/auth/server";
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

/* Server Components may not write cookies, but the SDK's Next adapter writes
   whatever the upstream sets whenever `getSession()` misses its cookie cache,
   which would throw mid-render. Render-time reads therefore get a context that
   drops writes: the browser keeps its existing cookies and the next read goes
   upstream again, while actions and the route handler still refresh cookies. */
export async function readOnlyRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();
  return {
    getCookies: () => extractNeonAuthCookies(headerStore),
    setCookie: () => {},
    getHeader: (name) => headerStore.get(name),
    getOrigin: () => headerStore.get("origin") ?? "",
    getFramework: () => "nextjs",
  };
}

function createSessionReader() {
  const { baseUrl, cookieSecret } = getAuthEnv();
  return createAuthServer({
    baseUrl,
    context: readOnlyRequestContext,
    cookieSecret,
    sessionDataTtl: 60,
    log: resolveNeonAuthLogging({ logLevel: "silent" }),
  });
}

let sessionReader: ReturnType<typeof createSessionReader> | undefined;

export function getSessionReader() {
  return sessionReader ??= createSessionReader();
}
