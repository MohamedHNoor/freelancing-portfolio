import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* The SDK is mocked at the `getAuth()` boundary. Env parsing, the owner rule,
   validation and result mapping are the real code path. */
const sdk = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  sendVerificationEmail: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({
  getAuth: () => ({
    signIn: { email: sdk.signInEmail },
    signOut: sdk.signOut,
    requestPasswordReset: sdk.requestPasswordReset,
    sendVerificationEmail: sdk.sendVerificationEmail,
    resetPassword: sdk.resetPassword,
  }),
}));

const { signIn, signOut, requestPasswordReset, resendVerification, resetPassword } = await import("@/actions/auth");

const OWNER = "owner@example.com";
const OWNER_ID = "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b";
const ownerUser = { id: OWNER_ID, email: OWNER, emailVerified: true };
const PRIVATE = "private-provider-detail";
let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEON_AUTH_BASE_URL", "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth");
  vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "c".repeat(32));
  vi.stubEnv("OWNER_EMAIL", OWNER);
  sdk.signOut.mockResolvedValue({ data: { success: true }, error: null });
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  errorLog.mockRestore();
});

function loggedText() {
  return JSON.stringify(errorLog.mock.calls);
}

describe("signIn", () => {
  const input = { email: " Owner@Example.com ", password: "correct horse battery" };

  it("returns field errors for invalid input without calling the SDK", async () => {
    const result = await signIn({ email: "nope", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("VALIDATION");
    expect(result.error?.fieldErrors?.email).toBeDefined();
    expect(result.error?.fieldErrors?.password).toBeDefined();
    expect(sdk.signInEmail).not.toHaveBeenCalled();
  });

  it("signs the owner in with the normalized email", async () => {
    sdk.signInEmail.mockResolvedValue({ data: { user: ownerUser }, error: null });
    expect(await signIn(input)).toEqual({ success: true, data: { redirectTo: "/dashboard" }, error: null });
    expect(sdk.signInEmail).toHaveBeenCalledWith({ email: OWNER, password: input.password });
    expect(sdk.signOut).not.toHaveBeenCalled();
  });

  it("maps a wrong password to INVALID_CREDENTIALS", async () => {
    sdk.signInEmail.mockResolvedValue({ data: null, error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD", message: PRIVATE } });
    const result = await signIn(input);
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
  });

  it("signs a non-owner account straight back out with the same generic error", async () => {
    sdk.signInEmail.mockResolvedValue({ data: { user: { ...ownerUser, email: "someone@example.com" } }, error: null });
    const result = await signIn({ email: "someone@example.com", password: "whatever" });
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(sdk.signOut).toHaveBeenCalledTimes(1);
  });

  it("tells only the owner that verification is outstanding", async () => {
    sdk.signInEmail.mockResolvedValue({ data: null, error: { status: 403, code: "EMAIL_NOT_VERIFIED" } });
    expect((await signIn(input)).error?.code).toBe("EMAIL_NOT_VERIFIED");
    expect((await signIn({ email: "someone@example.com", password: "x" })).error?.code).toBe("INVALID_CREDENTIALS");
  });

  it("maps an unexpected provider error or a throw to UNEXPECTED, logging a code only", async () => {
    sdk.signInEmail.mockResolvedValueOnce({ data: null, error: { status: 500, code: "UPSTREAM", message: PRIVATE } });
    expect((await signIn(input)).error?.code).toBe("UNEXPECTED");
    sdk.signInEmail.mockRejectedValueOnce(new TypeError(`fetch failed ${PRIVATE}`));
    const thrown = await signIn(input);
    expect(thrown.error?.code).toBe("UNEXPECTED");
    expect(JSON.stringify(thrown)).not.toContain(PRIVATE);
    expect(loggedText()).toContain("UPSTREAM");
    expect(loggedText()).not.toContain(PRIVATE);
    expect(loggedText()).not.toContain(OWNER);
    expect(loggedText()).not.toContain(input.password);
  });

  it("fails closed when auth configuration is missing", async () => {
    vi.stubEnv("OWNER_EMAIL", undefined);
    expect((await signIn(input)).error?.code).toBe("UNEXPECTED");
    expect(sdk.signInEmail).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("succeeds with or without a session", async () => {
    expect(await signOut()).toEqual({ success: true, data: { signedOut: true }, error: null });
    sdk.signOut.mockResolvedValueOnce({ data: null, error: { status: 401 } });
    expect((await signOut()).success).toBe(true);
  });

  it("reports a thrown failure as UNEXPECTED", async () => {
    sdk.signOut.mockRejectedValueOnce(new Error(PRIVATE));
    expect((await signOut()).error?.code).toBe("UNEXPECTED");
    expect(loggedText()).not.toContain(PRIVATE);
  });
});

describe.each([
  ["requestPasswordReset", requestPasswordReset, sdk.requestPasswordReset, { email: OWNER, redirectTo: "http://localhost:3000/reset-password" }],
  ["resendVerification", resendVerification, sdk.sendVerificationEmail, { email: OWNER, callbackURL: "http://localhost:3000/verify-email" }],
] as const)("%s", (_name, action, method, expectedCall) => {
  it("sends only for the owner and answers every well-formed email identically", async () => {
    method.mockResolvedValue({ data: { status: true }, error: null });
    const forOwner = await action({ email: " OWNER@example.com " });
    const forOther = await action({ email: "someone@example.com" });
    expect(forOwner).toEqual({ success: true, data: { sent: true }, error: null });
    expect(forOther).toEqual(forOwner);
    expect(method).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("rejects malformed input", async () => {
    expect((await action({ email: "not-an-email" })).error?.code).toBe("VALIDATION");
    expect(method).not.toHaveBeenCalled();
  });

  it("keeps the same answer when the provider fails, logging a code only", async () => {
    method.mockResolvedValueOnce({ data: null, error: { status: 500, code: "UPSTREAM", message: PRIVATE } });
    expect((await action({ email: OWNER })).success).toBe(true);
    method.mockRejectedValueOnce(new Error(PRIVATE));
    expect((await action({ email: OWNER })).success).toBe(true);
    expect(loggedText()).toContain("UPSTREAM");
    expect(loggedText()).not.toContain(PRIVATE);
    expect(loggedText()).not.toContain(OWNER);
  });
});

describe("resetPassword", () => {
  const input = { token: "fixture-token", password: "a new long password" };

  it("validates the token and the 12-character floor", async () => {
    const result = await resetPassword({ token: "", password: "short" });
    expect(result.error?.code).toBe("VALIDATION");
    expect(result.error?.fieldErrors?.token).toBeDefined();
    expect(result.error?.fieldErrors?.password).toBeDefined();
    expect(sdk.resetPassword).not.toHaveBeenCalled();
  });

  it("resets with the token and new password", async () => {
    sdk.resetPassword.mockResolvedValue({ data: { status: true }, error: null });
    expect(await resetPassword(input)).toEqual({ success: true, data: { reset: true }, error: null });
    expect(sdk.resetPassword).toHaveBeenCalledWith({ newPassword: input.password, token: input.token });
  });

  it.each(["INVALID_TOKEN", "TOKEN_EXPIRED"])("maps %s to INVALID_TOKEN", async (code) => {
    sdk.resetPassword.mockResolvedValue({ data: null, error: { status: 400, code } });
    expect((await resetPassword(input)).error?.code).toBe("INVALID_TOKEN");
  });

  it("surfaces Neon's stricter password rule as a field error", async () => {
    sdk.resetPassword.mockResolvedValue({ data: null, error: { status: 400, code: "PASSWORD_TOO_SHORT" } });
    const result = await resetPassword(input);
    expect(result.error?.code).toBe("VALIDATION");
    expect(result.error?.fieldErrors?.password).toBeDefined();
  });

  it("maps other failures to UNEXPECTED without leaking the token", async () => {
    sdk.resetPassword.mockRejectedValueOnce(new Error(PRIVATE));
    const result = await resetPassword(input);
    expect(result.error?.code).toBe("UNEXPECTED");
    expect(loggedText()).not.toContain(input.token);
    expect(loggedText()).not.toContain(PRIVATE);
  });
});
