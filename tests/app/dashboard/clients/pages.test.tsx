import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const OWNER_ID = "private-owner-id";
const CLIENT_ID = "3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  listClients: vi.fn(),
  getClient: vi.fn(),
  listClientActivity: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/auth/session", () => ({ requireOwner: mocks.requireOwner }));
vi.mock("@/server/queries/clients", () => ({ listClients: mocks.listClients, getClient: mocks.getClient }));
vi.mock("@/server/queries/activity", () => ({
  listClientActivity: mocks.listClientActivity,
  CLIENT_ACTIVITY_LIMIT: 50,
}));
vi.mock("@/actions/clients", () => ({ createClient: vi.fn(), updateClient: vi.fn(), archiveClient: vi.fn() }));

const { default: ClientsPage } = await import("@/app/dashboard/clients/page");
const { default: NewClientPage } = await import("@/app/dashboard/clients/new/page");
const { default: ClientPage } = await import("@/app/dashboard/clients/[clientId]/page");
const { default: EditClientPage } = await import("@/app/dashboard/clients/[clientId]/edit/page");
const { NotFoundError } = await import("@/lib/permissions");

const listItem = {
  id: CLIENT_ID,
  name: "Aroha Ngata",
  companyName: "Kōwhai Studio",
  email: "aroha@example.co.nz",
  countryCode: "NZ",
  defaultCurrency: "NZD",
  archivedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireOwner.mockResolvedValue({ userId: OWNER_ID });
  mocks.listClients.mockResolvedValue([]);
});

async function renderList(view?: string | string[]) {
  return renderToStaticMarkup(await ClientsPage({ searchParams: Promise.resolve({ view }) }));
}

describe("clients list page", () => {
  it("lists the session owner's active clients by default and for unknown views", async () => {
    mocks.listClients.mockResolvedValue([listItem]);
    for (const view of [undefined, "bogus", ["archived"]]) {
      const markup = await renderList(view);
      expect(markup).toContain("Kōwhai Studio");
      expect(markup).toContain("Aroha Ngata");
      expect(markup).toContain(`href="/dashboard/clients/${CLIENT_ID}"`);
      expect(markup).not.toContain(OWNER_ID);
    }
    expect(mocks.requireOwner).toHaveBeenCalledTimes(3);
    expect(mocks.listClients.mock.calls).toEqual([
      [OWNER_ID, { archived: false }],
      [OWNER_ID, { archived: false }],
      [OWNER_ID, { archived: false }],
    ]);
  });

  it("shows the archived view with archive dates", async () => {
    mocks.listClients.mockResolvedValue([{ ...listItem, archivedAt: new Date("2026-10-09T01:05:00Z") }]);
    const markup = await renderList("archived");
    expect(mocks.listClients).toHaveBeenCalledWith(OWNER_ID, { archived: true });
    expect(markup).toContain('<time dateTime="2026-10-09T01:05:00.000Z">9 Oct 2026</time>');
    expect(markup).toMatch(/<a aria-current="page"[^>]*href="\/dashboard\/clients\?view=archived"/);
    expect(markup).not.toMatch(/<a aria-current="page"[^>]*href="\/dashboard\/clients"/);
  });

  it("renders both empty states", async () => {
    expect(await renderList()).toContain("No clients yet");
    expect(await renderList("archived")).toContain("No archived clients");
  });

  it("renders client text as escaped text", async () => {
    mocks.listClients.mockResolvedValue([{ ...listItem, companyName: "<script>alert(1)</script>" }]);
    const markup = await renderList();
    expect(markup).not.toContain("<script>alert(1)</script>");
    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("stops at the owner check", async () => {
    const redirect = new Error("NEXT_REDIRECT /login");
    mocks.requireOwner.mockRejectedValue(redirect);
    await expect(renderList()).rejects.toBe(redirect);
    expect(mocks.listClients).not.toHaveBeenCalled();
  });
});

describe("new client page", () => {
  it("guards the page and renders the create form", async () => {
    const markup = renderToStaticMarkup(await NewClientPage());
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Create client");
    expect(markup).toMatch(/<label[^>]*for="client-name"[^>]*>Contact name<span[^>]*>\(required\)<\/span><\/label>/);
    expect(markup).toMatch(/<select[^>]*aria-required="true"[^>]*id="client-currency"|<select[^>]*id="client-currency"[^>]*aria-required="true"/);
  });

  it("stops at the owner check", async () => {
    const redirect = new Error("NEXT_REDIRECT /login");
    mocks.requireOwner.mockRejectedValue(redirect);
    await expect(NewClientPage()).rejects.toBe(redirect);
  });
});

const stored = {
  ...listItem,
  ownerId: OWNER_ID,
  phone: null,
  addressLine1: "12 Cuba Street",
  addressLine2: null,
  city: "Wellington",
  region: null,
  postalCode: "6011",
  notes: "Line one\nLine two",
  stripeCustomerId: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-01T00:00:00Z"),
};

const params = (clientId = CLIENT_ID) => ({ params: Promise.resolve({ clientId }) });

describe("client detail page", () => {
  beforeEach(() => {
    mocks.getClient.mockResolvedValue(stored);
    mocks.listClientActivity.mockResolvedValue([
      { id: "a1", type: "client_created", summary: "Created client Kōwhai Studio", occurredAt: new Date("2026-10-09T01:05:00Z") },
    ]);
  });

  it("loads the client for the session owner and shows details and activity", async () => {
    const markup = renderToStaticMarkup(await ClientPage(params()));
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(mocks.getClient).toHaveBeenCalledWith(OWNER_ID, CLIENT_ID);
    expect(mocks.listClientActivity).toHaveBeenCalledWith(OWNER_ID, CLIENT_ID);
    expect(markup).toContain("Kōwhai Studio");
    expect(markup).toContain('href="mailto:aroha@example.co.nz"');
    expect(markup).toContain("Not provided");
    expect(markup).toContain('<span class="whitespace-pre-line">Line one\nLine two</span>');
    expect(markup).toContain('<time dateTime="2026-10-09T01:05:00.000Z"');
    expect(markup).toContain("9 Oct 2026, 2:05 pm");
    expect(markup).toContain("Edit client");
    expect(markup).toContain("Archive client");
    expect(markup).not.toContain(OWNER_ID);
  });

  it("hides the edit and archive actions for an archived client", async () => {
    mocks.getClient.mockResolvedValue({ ...stored, archivedAt: new Date("2026-10-09T01:05:00Z") });
    const markup = renderToStaticMarkup(await ClientPage(params()));
    expect(markup).toContain("Archived");
    expect(markup).toContain("Archived clients can&#x27;t be edited.");
    expect(markup).not.toContain("Edit client");
    expect(markup).not.toContain("Archive client");
  });

  it("notes when the activity list is capped", async () => {
    mocks.listClientActivity.mockResolvedValue(
      Array.from({ length: 50 }, (_, index) => ({
        id: `a${index}`,
        type: "client_updated",
        summary: "Updated client Kōwhai Studio",
        occurredAt: new Date("2026-10-09T01:05:00Z"),
      })),
    );
    expect(renderToStaticMarkup(await ClientPage(params()))).toContain("Showing the 50 most recent changes.");
  });

  it("renders user-entered text as escaped text", async () => {
    mocks.getClient.mockResolvedValue({ ...stored, companyName: "<img src=x onerror=alert(1)>", notes: "<b>bold</b>" });
    const markup = renderToStaticMarkup(await ClientPage(params()));
    expect(markup).not.toContain("<img src=x");
    expect(markup).not.toContain("<b>bold</b>");
    expect(markup).toContain("&lt;b&gt;bold&lt;/b&gt;");
  });

  it.each(["not-a-uuid", "11111111-1111-4111-8111-111111111111"])("shows the scoped 404 for %s", async (clientId) => {
    mocks.getClient.mockRejectedValue(new NotFoundError());
    await expect(ClientPage(params(clientId))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("lets unexpected errors reach the error boundary", async () => {
    const failure = new Error("database unavailable");
    mocks.listClientActivity.mockRejectedValue(failure);
    await expect(ClientPage(params())).rejects.toBe(failure);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});

describe("edit client page", () => {
  it("prefills the form for an active client", async () => {
    mocks.getClient.mockResolvedValue(stored);
    const markup = renderToStaticMarkup(await EditClientPage(params()));
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(mocks.getClient).toHaveBeenCalledWith(OWNER_ID, CLIENT_ID);
    expect(markup).toContain('value="Aroha Ngata"');
    expect(markup).toContain("Save changes");
    expect(markup).toContain(`href="/dashboard/clients/${CLIENT_ID}"`);
  });

  it("redirects an archived client to its detail page", async () => {
    mocks.getClient.mockResolvedValue({ ...stored, archivedAt: new Date() });
    await expect(EditClientPage(params())).rejects.toThrow(`NEXT_REDIRECT /dashboard/clients/${CLIENT_ID}`);
  });

  it("shows the scoped 404 for another owner's or a malformed id", async () => {
    mocks.getClient.mockRejectedValue(new NotFoundError());
    await expect(EditClientPage(params("not-a-uuid"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("stops at the owner check and propagates unexpected errors", async () => {
    const redirect = new Error("NEXT_REDIRECT /login");
    mocks.requireOwner.mockRejectedValueOnce(redirect);
    await expect(EditClientPage(params())).rejects.toBe(redirect);
    expect(mocks.getClient).not.toHaveBeenCalled();

    const failure = new Error("database unavailable");
    mocks.getClient.mockRejectedValue(failure);
    await expect(EditClientPage(params())).rejects.toBe(failure);
  });
});
