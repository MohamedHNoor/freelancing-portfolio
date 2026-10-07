import { getAuth } from "@/lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };

/* Same-origin proxy to Managed Better Auth, limited to what a browser on this
   site may need. Sign-in, password reset and verification go through the
   Server Actions, which apply the owner rule; forwarding every upstream path
   would offer a second, unguarded way in. The handlers are resolved inside
   the request, so importing this route, as the build does, reads no env. */
const ALLOWED = { GET: new Set(["get-session"]), POST: new Set(["sign-out"]) } as const;

let handlers: ReturnType<ReturnType<typeof getAuth>["handler"]> | undefined;
const resolve = () => handlers ??= getAuth().handler();

async function allowed(method: keyof typeof ALLOWED, context: Context): Promise<boolean> {
  const { path } = await context.params;
  return ALLOWED[method].has(path.join("/"));
}

const notFound = () => new Response(null, { status: 404 });

export async function GET(request: Request, context: Context) {
  return (await allowed("GET", context)) ? resolve().GET(request, context) : notFound();
}

export async function POST(request: Request, context: Context) {
  return (await allowed("POST", context)) ? resolve().POST(request, context) : notFound();
}
