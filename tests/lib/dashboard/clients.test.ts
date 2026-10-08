import { describe, expect, it } from "vitest";
import { addressLines, clientDisplayName, clientFormValues, parseClientView } from "@/lib/dashboard/clients";
import { clientInputSchema } from "@/lib/validation/client";

const stored = {
  name: "Aroha Ngata",
  email: "aroha@example.co.nz",
  phone: null,
  companyName: "Kōwhai Studio",
  countryCode: "NZ",
  defaultCurrency: "NZD" as const,
  addressLine1: "12 Cuba Street",
  addressLine2: null,
  city: "Wellington",
  region: "",
  postalCode: "6011",
  notes: null,
};

describe("parseClientView", () => {
  it.each([
    ["archived", "archived"],
    [undefined, "active"],
    ["active", "active"],
    ["Archived", "active"],
    [["archived"], "active"],
    ["bogus", "active"],
  ])("reads %j as %s", (value, view) => {
    expect(parseClientView(value)).toBe(view);
  });
});

describe("client display helpers", () => {
  it("prefers the company name", () => {
    expect(clientDisplayName(stored)).toBe("Kōwhai Studio");
    expect(clientDisplayName({ ...stored, companyName: null })).toBe("Aroha Ngata");
  });

  it("lists present address parts in order", () => {
    expect(addressLines(stored)).toEqual(["12 Cuba Street", "Wellington", "6011"]);
    expect(addressLines({ addressLine1: null, addressLine2: null, city: null, region: null, postalCode: null })).toEqual([]);
  });

  it("maps a stored client to form values that round-trip through the schema", () => {
    const values = clientFormValues(stored);
    expect(values).toMatchObject({ phone: "", addressLine2: "", notes: "", countryCode: "NZ" });
    expect(clientInputSchema.parse(values)).toEqual({ ...stored, region: null });
  });
});
