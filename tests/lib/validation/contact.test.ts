import { describe, expect, it } from "vitest";
import { PROJECT_TYPES, contactSchema } from "@/lib/validation/contact";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  projectType: "figma-conversion" as const,
  timeline: "Next month",
  message: "I have a finished Figma file for six pages and no front-end capacity.",
  company: "",
};

const parse = (patch: Record<string, unknown> = {}) =>
  contactSchema.safeParse({ ...valid, ...patch });

/** Every message a visitor could see, for the "no Zod defaults" assertion. */
const messagesFor = (patch: Record<string, unknown>) => {
  const r = parse(patch);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("contactSchema, valid input", () => {
  it("accepts a well-formed submission", () => {
    expect(parse().success).toBe(true);
  });

  it("trims whitespace and lowercases the address", () => {
    const r = parse({ name: "  Ada  ", email: "  ADA@Example.COM  " });
    expect(r.success && r.data.name).toBe("Ada");
    expect(r.success && r.data.email).toBe("ada@example.com");
  });

  it("accepts an absent budgetRange", () => {
    expect(parse({ budgetRange: undefined }).success).toBe(true);
  });

  it("accepts every declared project type", () => {
    for (const projectType of PROJECT_TYPES) {
      expect(parse({ projectType }).success).toBe(true);
    }
  });
});

describe("contactSchema, boundaries", () => {
  it.each([
    ["name too short", { name: "A" }],
    ["name too long", { name: "A".repeat(101) }],
    ["message too short", { message: "A".repeat(19) }],
    ["message too long", { message: "A".repeat(5001) }],
    ["email malformed", { email: "not-an-address" }],
    ["timeline empty", { timeline: "   " }],
    ["budgetRange too long", { budgetRange: "A".repeat(101) }],
    ["unknown project type", { projectType: "consulting" }],
  ])("rejects %s", (_label, patch) => {
    expect(parse(patch).success).toBe(false);
  });

  it.each([
    ["name at the lower bound", { name: "Ad" }],
    ["name at the upper bound", { name: "A".repeat(100) }],
    ["message at the lower bound", { message: "A".repeat(20) }],
    ["message at the upper bound", { message: "A".repeat(5000) }],
    ["budgetRange at the upper bound", { budgetRange: "A".repeat(100) }],
  ])("accepts %s", (_label, patch) => {
    expect(parse(patch).success).toBe(true);
  });
});

describe("contactSchema, the honeypot", () => {
  it("rejects a filled honeypot", () => {
    expect(parse({ company: "Acme Corp" }).success).toBe(false);
  });

  it("accepts an empty honeypot", () => {
    expect(parse({ company: "" }).success).toBe(true);
  });
});

describe("contactSchema, header safety", () => {
  /* `name` is the only submitted value that reaches the subject line. */
  it("replaces carriage returns and newlines in the name", () => {
    const r = parse({ name: "Ada\r\nBcc: someone@example.com" });
    expect(r.success && r.data.name).toBe("Ada Bcc: someone@example.com");
    expect(r.success && r.data.name).not.toMatch(/[\r\n]/);
  });

  it("collapses a run of newlines into one space", () => {
    const r = parse({ name: "Ada\n\n\nLovelace" });
    expect(r.success && r.data.name).toBe("Ada Lovelace");
  });
});

describe("contactSchema, error messages", () => {
  /* A visitor reads these. Zod's defaults ("String must contain at least 2
     character(s)") are not acceptable copy. */
  it("writes every message for a human", () => {
    const all = [
      ...messagesFor({ name: "A" }),
      ...messagesFor({ email: "nope" }),
      ...messagesFor({ message: "short" }),
      ...messagesFor({ timeline: "" }),
      ...messagesFor({ projectType: "nope" }),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const message of all) {
      expect(message).not.toMatch(/String must contain|Invalid enum|Expected/);
      expect(message.endsWith(".") || message.endsWith("?")).toBe(true);
    }
  });
});
