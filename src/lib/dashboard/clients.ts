import type { ClientInput } from "@/lib/validation/client";
import type { Currency } from "@/lib/money";

export type ClientView = "active" | "archived";

/** The list's `?view=` value. Only the exact string "archived" changes the view. */
export function parseClientView(value: unknown): ClientView {
  return value === "archived" ? "archived" : "active";
}

type Named = { name: string; companyName: string | null };

/** The name a client is shown by: the company, or the contact when there is none. */
export function clientDisplayName({ companyName, name }: Named): string {
  return companyName ?? name;
}

type StoredClient = Named & {
  email: string;
  phone: string | null;
  countryCode: string | null;
  defaultCurrency: Currency;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  notes: string | null;
};

/** A stored client as edit-form values; empty fields become "". */
export function clientFormValues(client: StoredClient): ClientInput {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone ?? "",
    companyName: client.companyName ?? "",
    countryCode: client.countryCode ?? "",
    defaultCurrency: client.defaultCurrency,
    addressLine1: client.addressLine1 ?? "",
    addressLine2: client.addressLine2 ?? "",
    city: client.city ?? "",
    region: client.region ?? "",
    postalCode: client.postalCode ?? "",
    notes: client.notes ?? "",
  };
}

/** The address parts that are present, in display order. */
export function addressLines(
  client: Pick<StoredClient, "addressLine1" | "addressLine2" | "city" | "region" | "postalCode">,
): string[] {
  return [client.addressLine1, client.addressLine2, client.city, client.region, client.postalCode].filter(
    (part): part is string => part !== null && part !== "",
  );
}
