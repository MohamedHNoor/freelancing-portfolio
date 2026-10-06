import { getAuth } from "@/lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };

/* Same-origin proxy to Managed Better Auth. The handlers are resolved inside the
   request, so importing this route, as the build does, reads no env. */
let handlers: ReturnType<ReturnType<typeof getAuth>["handler"]> | undefined;
const resolve = () => handlers ??= getAuth().handler();

export function GET(request: Request, context: Context) {
  return resolve().GET(request, context);
}

export function POST(request: Request, context: Context) {
  return resolve().POST(request, context);
}
