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

/* The cookies a non-owner sign-in would leave behind, plus one that is not ours. */
const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [
    { name: "__Secure-neon-auth.session_token", value: "t" },
    { name: "__Secure-neon-auth.local.session_data", value: "d" },
    { name: "theme", value: "dark" },
  ]),
  set: vi.fn(),
}));

vi.mock("server-only", () => ({}));
const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore, headers: async () => requestHeaders.current }));
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
  requestHeaders.current = new Headers();
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

  it.each(["INVALID_EMAIL_OR_PASSWORD", "INVALID_PASSWORD", "invalid_credentials"])("maps %s to INVALID_CREDENTIALS", async (code) => {
    sdk.signInEmail.mockResolvedValue({ data: null, error: { status: 401, code, message: PRIVATE } });
    const result = await signIn(input);
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
  });

  it("signs a non-owner account straight back out with the same generic error", async () => {
    sdk.signInEmail.mockResolvedValue({ data: { user: { ...ownerUser, email: "someone@example.com" } }, error: null });
    const result = await signIn({ email: "someone@example.com", password: "whatever" });
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(sdk.signOut).toHaveBeenCalledTimes(1);
    // The SDK's sign-out cannot see the new session, so the action expires the
    // Neon Auth cookies itself, Secure so `__Secure-` cookies are replaced.
    const cleared = cookieStore.set.mock.calls.map(([name]) => name);
    expect(cleared).toEqual(["__Secure-neon-auth.session_token", "__Secure-neon-auth.local.session_data"]);
    for (const [, value, options] of cookieStore.set.mock.calls) {
      expect(value).toBe("");
      expect(options).toMatchObject({ maxAge: 0, path: "/", secure: true });
    }
  });

  it("still clears cookies and logs only a code when the non-owner sign-out fails", async () => {
    sdk.signInEmail.mockResolvedValue({ data: { user: { ...ownerUser, email: "someone@example.com" } }, error: null });
    sdk.signOut.mockResolvedValueOnce({ data: null, error: { status: 401, code: "UNAUTHORIZED", message: PRIVATE } });
    const result = await signIn({ email: "someone@example.com", password: "whatever" });
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(errorLog).toHaveBeenCalledWith("[auth] signIn.nonOwnerSignOut failed: UNAUTHORIZED");
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(PRIVATE);
  });

  it("does not touch cookies when the owner signs in", async () => {
    sdk.signInEmail.mockResolvedValue({ data: { user: ownerUser }, error: null });
    await signIn(input);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it.each([
    { status: 403, code: "EMAIL_NOT_VERIFIED" },
    { status: 422, code: "email_not_confirmed" },
  ])("tells only the owner that verification is outstanding for $code", async (error) => {
    sdk.signInEmail.mockResolvedValue({ data: null, error });
    expect((await signIn(input)).error?.code).toBe("EMAIL_NOT_VERIFIED");
    expect((await signIn({ email: "someone@example.com", password: "x" })).error?.code).toBe("INVALID_CREDENTIALS");
  });

  it("does not describe unrelated forbidden responses as email verification failures", async () => {
    sdk.signInEmail.mockResolvedValue({ data: null, error: { status: 403, code: "INVALID_ORIGIN", message: PRIVATE } });
    const result = await signIn(input);
    expect(result.error?.code).toBe("UNEXPECTED");
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
    expect(loggedText()).toContain("INVALID_ORIGIN");
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

  it.each([
    { status: 400, code: "INVALID_TOKEN" },
    { status: 400, code: "TOKEN_EXPIRED" },
    { status: 401, code: "bad_jwt" },
  ])("maps $code to INVALID_TOKEN", async (error) => {
    sdk.resetPassword.mockResolvedValue({ data: null, error });
    expect((await resetPassword(input)).error?.code).toBe("INVALID_TOKEN");
  });

  it("keeps unrelated SDK validation failures unexpected", async () => {
    sdk.resetPassword.mockResolvedValue({ data: null, error: { status: 400, code: "validation_failed", message: PRIVATE } });
    const result = await resetPassword(input);
    expect(result.error?.code).toBe("UNEXPECTED");
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
    expect(loggedText()).not.toContain(input.token);
  });

  it.each(["PASSWORD_TOO_SHORT", "PASSWORD_TOO_LONG", "weak_password"])("surfaces %s as a password field error", async (code) => {
    sdk.resetPassword.mockResolvedValue({ data: null, error: { status: 400, code } });
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

describe("email request rate limit", () => {
  const send = { email: OWNER };
  const sent = { success: true, data: { sent: true }, error: null };

  it.each([
    ["requestPasswordReset", requestPasswordReset, sdk.requestPasswordReset, "203.0.113.10"],
    ["resendVerification", resendVerification, sdk.sendVerificationEmail, "203.0.113.11"],
  ] as const)("%s sends three per visitor, then answers the same with nothing sent", async (action, request, provider, ip) => {
    provider.mockResolvedValue({ data: {}, error: null });
    requestHeaders.current = new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
    for (let i = 0; i < 3; i++) expect(await request(send)).toEqual(sent);
    expect(await request(send)).toEqual(sent);
    expect(provider).toHaveBeenCalledTimes(3);
    expect(errorLog).toHaveBeenCalledWith(`[auth] ${action} failed: rate_limited`);

    // Another visitor is unaffected.
    requestHeaders.current = new Headers({ "x-forwarded-for": "203.0.113.99" });
    expect(await request(send)).toEqual(sent);
    expect(provider).toHaveBeenCalledTimes(4);
  });

  it("counts non-owner addresses too, so the limit reveals nothing about accounts", async () => {
    sdk.requestPasswordReset.mockResolvedValue({ data: {}, error: null });
    requestHeaders.current = new Headers({ "x-forwarded-for": "203.0.113.20" });
    for (let i = 0; i < 3; i++) await requestPasswordReset({ email: "someone@example.com" });
    expect(await requestPasswordReset(send)).toEqual(sent);
    expect(sdk.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("skips the limiter when the caller cannot be identified", async () => {
    sdk.requestPasswordReset.mockResolvedValue({ data: {}, error: null });
    for (let i = 0; i < 5; i++) await requestPasswordReset(send);
    expect(sdk.requestPasswordReset).toHaveBeenCalledTimes(5);
  });
});
