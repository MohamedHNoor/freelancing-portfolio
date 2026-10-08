import { describe, expect, it } from "vitest";
import { CLIENT_FIELDS, clientInputSchema } from "@/lib/validation/client";

const minimal = { name: "Aroha Ngata", email: "aroha@example.co.nz", defaultCurrency: "NZD" };

function fieldErrors(input: unknown) {
  const result = clientInputSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error?.flatten().fieldErrors ?? {};
}

describe("clientInputSchema", () => {
  it("normalizes text, email, country code and empty optional fields", () => {
    const values = clientInputSchema.parse({
      ...minimal,
      name: "  Aroha Ngata ",
      email: " Aroha@Example.CO.NZ ",
      countryCode: " nz ",
      companyName: "   ",
      phone: "",
      notes: "  Prefers email.  ",
    });

    expect(values).toEqual({
      name: "Aroha Ngata",
      email: "aroha@example.co.nz",
      phone: null,
      companyName: null,
      countryCode: "NZ",
      defaultCurrency: "NZD",
      addressLine1: null,
      addressLine2: null,
      city: null,
      region: null,
      postalCode: null,
      notes: "Prefers email.",
    });
  });

  it("returns every editable field", () => {
    expect(Object.keys(clientInputSchema.parse(minimal)).sort()).toEqual([...CLIENT_FIELDS].sort());
  });

  it.each([
    ["name", 120],
    ["phone", 40],
    ["companyName", 160],
    ["addressLine1", 200],
    ["addressLine2", 200],
    ["city", 100],
    ["region", 100],
    ["postalCode", 20],
    ["notes", 5000],
  ] as const)("limits %s to %d characters", (field, max) => {
    expect(clientInputSchema.safeParse({ ...minimal, [field]: "a".repeat(max) }).success).toBe(true);
    expect(fieldErrors({ ...minimal, [field]: "a".repeat(max + 1) })[field]).toEqual([
      `Use at most ${max.toLocaleString("en-NZ")} characters.`,
    ]);
  });

  it("requires a name, a valid email and a supported currency", () => {
    expect(fieldErrors({ ...minimal, name: "  " }).name).toEqual(["Enter the contact's name."]);
    expect(fieldErrors({ email: minimal.email, defaultCurrency: "NZD" }).name).toEqual(["Enter the contact's name."]);
    expect(fieldErrors({ ...minimal, email: "not-an-email" }).email).toEqual(["Enter a valid email address."]);
    expect(fieldErrors({ ...minimal, email: `${"a".repeat(250)}@b.io` }).email).toEqual(["Enter a valid email address."]);
    expect(fieldErrors({ name: "A", email: "a@b.io" }).defaultCurrency).toEqual(["Choose a currency."]);
    expect(fieldErrors({ ...minimal, defaultCurrency: "EUR" }).defaultCurrency).toEqual(["Choose a currency."]);
  });

  it.each(["N", "NZL", "N1", "1Z"])("rejects the country code %j", (countryCode) => {
    expect(fieldErrors({ ...minimal, countryCode }).countryCode).toEqual([
      "Use a two-letter country code, such as NZ.",
    ]);
  });
});
