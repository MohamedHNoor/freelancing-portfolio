import "server-only";
import type { z } from "zod";
import { ConflictError, NotFoundError } from "@/lib/permissions";
import { idSchema } from "@/lib/validation/money";
import { requireOwnerForAction, type Owner } from "@/server/auth/session";
import type { ActionErrorCode, ActionFailure, ActionResult } from "@/types/action";

type OwnerActionCode = Extract<ActionErrorCode, "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "UNEXPECTED">;

const DEFAULT_MESSAGES: Record<OwnerActionCode, string> = {
  VALIDATION: "Some of those details need another look.",
  NOT_FOUND: "That record could not be found.",
  CONFLICT: "That change is no longer possible.",
  UNEXPECTED: "Something went wrong. Please try again in a moment.",
};

type Messages = Partial<Record<"NOT_FOUND" | "CONFLICT", string>>;

type OwnerActionConfig<S extends z.ZodTypeAny> = {
  /** Log prefix and action name, such as `["clients", "createClient"]`. Never user data. */
  label: readonly [scope: string, action: string];
  schema: S;
  /** A record id from the browser. Present only for actions on an existing record. */
  id?: unknown;
  messages?: Messages;
};

type Context = { owner: Owner; id: string };

/** A Prisma error code such as P2002, or the error's class name. Never its message. */
function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && /^P\d{4}$/.test(code)) return code;
  return error instanceof Error ? error.name : "unknown";
}

/**
 * The pipeline every dashboard action follows: the owner check first, then the
 * record id (a malformed id is reported exactly like another owner's record),
 * then input validation, then the handler with known errors mapped.
 */
export async function ownerAction<S extends z.ZodTypeAny, T>(
  config: OwnerActionConfig<S>,
  raw: unknown,
  handler: (context: Context, data: z.output<S>) => Promise<T>,
): Promise<ActionResult<T>> {
  const messages = { ...DEFAULT_MESSAGES, ...config.messages };
  const fail = (code: OwnerActionCode, fieldErrors?: Record<string, string[]>): ActionFailure => ({
    success: false,
    data: null,
    error: { code, message: messages[code], ...(fieldErrors ? { fieldErrors } : {}) },
  });

  const owner = await requireOwnerForAction();
  if ("success" in owner) return owner;

  let id = "";
  if ("id" in config) {
    const parsedId = idSchema.safeParse(config.id);
    if (!parsedId.success) return fail("NOT_FOUND");
    id = parsedId.data;
  }

  const parsed = config.schema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    return { success: true, data: await handler({ owner, id }, parsed.data), error: null };
  } catch (error) {
    if (error instanceof NotFoundError) return fail("NOT_FOUND");
    if (error instanceof ConflictError) return fail("CONFLICT");
    const [scope, action] = config.label;
    console.error(`[${scope}] ${action} failed: ${errorCode(error)}`);
    return fail("UNEXPECTED");
  }
}
