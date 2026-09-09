import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* `headers()` needs a request context and `emails.send` would post to Resend,
   so both are mocked. Everything else, including the schema, the honeypot rule,
   the rate limiter and the env checks, is the real code path. */
const sendMock = vi.fn();
let forwardedFor: string | null = "203.0.113.1";

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "x-forwarded-for" ? forwardedFor : null) }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const { submitContact } = await import("@/actions/contact");

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  projectType: "figma-conversion",
  timeline: "Next month",
  message: "I have a finished Figma file for six pages and no front-end capacity.",
  company: "",
};

/** A fresh key per test: the limiter store lives at module scope. */
let ipCounter = 0;
const freshIp = () => `198.51.100.${++ipCounter}`;

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email-id" }, error: null });
  forwardedFor = freshIp();
  process.env.RESEND_API_KEY = "test-key";
  process.env.CONTACT_TO_EMAIL = "delivered@resend.dev";
  process.env.CONTACT_FROM_EMAIL = "onboarding@resend.dev";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitContact, configuration", () => {
  it.each(["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"])(
    "fails closed and sends nothing when %s is missing",
    async (name) => {
      delete process.env[name];
      const result = await submitContact(valid);
      expect(result.success).toBe(false);
      expect(sendMock).not.toHaveBeenCalled();
    },
  );

  it("never names the missing variable in what it returns", async () => {
    delete process.env.CONTACT_TO_EMAIL;
    const result = await submitContact(valid);
    const text = JSON.stringify(result);
    for (const secret of ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL", "test-key"]) {
      expect(text).not.toContain(secret);
    }
  });
});

describe("submitContact, validation", () => {
  it("returns field errors and sends nothing for an invalid payload", async () => {
    const result = await submitContact({ ...valid, email: "nope", message: "short" });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.fieldErrors).toHaveProperty("email");
    expect(result.success === false && result.error.fieldErrors).toHaveProperty("message");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("re-validates rather than trusting the caller", async () => {
    const result = await submitContact({ garbage: true });
    expect(result.success).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  /* Regression: the honeypot was originally judged from `fieldErrors.company`,
     so a payload with no `company` key at all produced an error there and was
     answered with a fake success. Real submissions were silently dropped. */
  it("does not mistake a missing honeypot field for a caught bot", async () => {
    const withoutHoneypot: Record<string, unknown> = { ...valid };
    delete withoutHoneypot.company;
    const result = await submitContact(withoutHoneypot);
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.fieldErrors).toHaveProperty("company");
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("submitContact, the honeypot", () => {
  /* A caught bot gets the success shape. Telling it what tripped teaches it to
     leave the field alone next time. */
  it("looks like a success but sends nothing", async () => {
    const result = await submitContact({ ...valid, company: "Acme" });
    expect(result.success).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("submitContact, delivery", () => {
  it("sends plain text with replyTo set to the submitter", async () => {
    await submitContact(valid);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const [payload, options] = sendMock.mock.calls[0];
    expect(payload.replyTo).toBe("ada@example.com");
    expect(payload.text).toContain("I have a finished Figma file");
    expect(payload).not.toHaveProperty("html");
    expect(options.idempotencyKey).toMatch(/^contact-enquiry\/[0-9a-f]{32}$/);
  });

  it("keeps the subject free of carriage returns and newlines", async () => {
    await submitContact({ ...valid, name: "Ada\r\nBcc: x@y.com" });
    const [payload] = sendMock.mock.calls[0];
    expect(payload.subject).not.toMatch(/[\r\n]/);
  });

  it("gives the same idempotency key to a retry and a different one to a new enquiry", async () => {
    await submitContact(valid);
    forwardedFor = freshIp();
    await submitContact(valid);
    forwardedFor = freshIp();
    await submitContact({ ...valid, message: `${valid.message} Also one more thing.` });
    const keys = sendMock.mock.calls.map(([, options]) => options.idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  /* The regression behind F-02. The key hashed `email` and `message` only, so a
     visitor who resent the same message after correcting any other field reused
     a live key with a changed payload. Resend answers that with a 409
     `invalid_idempotent_request`, which this action reports as a generic
     failure, so the corrected enquiry was silently lost for 24 hours. Every
     field below reaches the sent payload. */
  it.each([
    ["name", { name: "Ada B Lovelace" }],
    ["projectType", { projectType: "saas-build" as const }],
    ["timeline", { timeline: "Whenever you have capacity" }],
    ["budgetRange", { budgetRange: "8k to 12k" }],
  ])("gives a different key when only %s changes", async (_label, patch) => {
    await submitContact(valid);
    forwardedFor = freshIp();
    await submitContact({ ...valid, ...patch });
    const keys = sendMock.mock.calls.map(([, options]) => options.idempotencyKey);
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
  });

  it("treats an omitted budget and an empty one as the same enquiry", async () => {
    await submitContact(valid);
    forwardedFor = freshIp();
    await submitContact({ ...valid, budgetRange: "" });
    const keys = sendMock.mock.calls.map(([, options]) => options.idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
  });

  it("quotes the display name so a comma cannot add a second mailbox", async () => {
    await submitContact({ ...valid, name: "Lovelace, Ada" });
    const [payload] = sendMock.mock.calls[0];
    expect(payload.from).toBe('"Lovelace, Ada" <onboarding@resend.dev>');
  });

  it("labels a missing budget instead of leaving the line blank", async () => {
    await submitContact({ ...valid, budgetRange: "" });
    const [payload] = sendMock.mock.calls[0];
    expect(payload.text).toContain("Budget:   not given");
  });

  it("does not leak the provider error to the caller", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "domain is not verified: acme.test" },
    });
    const result = await submitContact(valid);
    expect(result.success).toBe(false);
    const text = JSON.stringify(result);
    expect(text).not.toContain("acme.test");
    expect(text).not.toContain("validation_error");
  });

  it("survives a network-level throw", async () => {
    sendMock.mockRejectedValue(new Error("ECONNRESET https://api.resend.com"));
    const result = await submitContact(valid);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain("api.resend.com");
  });
});

describe("submitContact, rate limiting", () => {
  it("blocks the fourth submission from one address and stops sending", async () => {
    const ip = freshIp();
    forwardedFor = ip;
    for (let i = 0; i < 3; i++) {
      expect((await submitContact({ ...valid, message: `${valid.message} ${i}` })).success).toBe(true);
    }
    const fourth = await submitContact({ ...valid, message: `${valid.message} 4` });
    expect(fourth.success).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(3);
  });
});
