import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const OWNER_ID = "private-owner-id";
const PROJECT_ID = "5a6b7c8d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";
const CLIENT_ID = "3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  listProjects: vi.fn(),
  listProjectClients: vi.fn(),
  getProjectView: vi.fn(),
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
vi.mock("@/server/queries/projects", () => ({
  listProjects: mocks.listProjects,
  listProjectClients: mocks.listProjectClients,
  getProjectView: mocks.getProjectView,
}));
vi.mock("@/actions/projects", () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  changeProjectStatus: vi.fn(),
  deleteProject: vi.fn(),
}));
vi.mock("@/actions/milestones", () => ({
  createMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  applyPlanPreset: vi.fn(),
  reorderMilestones: vi.fn(),
  deleteMilestone: vi.fn(),
  cancelMilestone: vi.fn(),
  restoreMilestone: vi.fn(),
}));

const { default: ProjectsPage } = await import("@/app/dashboard/projects/page");
const { default: NewProjectPage } = await import("@/app/dashboard/projects/new/page");
const { default: ProjectPage } = await import("@/app/dashboard/projects/[projectId]/page");
const { default: PlanPage } = await import("@/app/dashboard/projects/[projectId]/plan/page");
const { default: SettingsPage } = await import("@/app/dashboard/projects/[projectId]/settings/page");
const { NotFoundError } = await import("@/lib/permissions");

const milestone = (overrides: Record<string, unknown> = {}) => ({
  id: "m1",
  name: "Deposit",
  description: null,
  position: 0,
  billingTrigger: "upfront",
  pricingMode: "percentage",
  percentageBps: 3000,
  amountMinor: 1500000,
  status: "pending",
  dueDate: null,
  progress: 0,
  ...overrides,
});

const view = (overrides: Record<string, unknown> = {}) => ({
  id: PROJECT_ID,
  name: "Shop rebuild",
  description: "Line one\nLine two",
  status: "draft",
  currency: "NZD",
  totalAmountMinor: 5000000,
  startDate: "2026-03-01",
  expectedEndDate: "2026-06-30",
  client: { id: CLIENT_ID, displayName: "Kōwhai Studio", archived: false },
  milestones: [milestone(), milestone({ id: "m2", name: "Build", position: 1, billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 2000000 })],
  plan: { allocated: 3500000, unallocated: 1500000, balanced: false },
  figures: { paid: 0, outstanding: 5000000, requested: 0, paymentProgress: 0 },
  developmentProgress: 0,
  canActivate: false,
  canComplete: false,
  ...overrides,
});

const params = (projectId = PROJECT_ID) => ({ params: Promise.resolve({ projectId }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireOwner.mockResolvedValue({ userId: OWNER_ID });
  mocks.listProjects.mockResolvedValue([]);
  mocks.listProjectClients.mockResolvedValue([]);
  mocks.getProjectView.mockResolvedValue(view());
});

describe("projects list", () => {
  const render = async (status?: string | string[]) =>
    renderToStaticMarkup(await ProjectsPage({ searchParams: Promise.resolve({ status }) }));

  it("lists the owner's projects for a known status tab", async () => {
    const markup = await render("on_hold");
    expect(mocks.listProjects).toHaveBeenCalledWith(OWNER_ID, { status: "on_hold" });
    expect(markup).toContain('aria-current="page" class');
    expect(markup).toContain("No on hold projects");
  });

  it.each(["bogus", ["active", "draft"], undefined])("treats %j as All", async (status) => {
    const markup = await render(status);
    expect(mocks.listProjects).toHaveBeenCalledWith(OWNER_ID, { status: "all" });
    expect(markup).toContain("No projects yet");
  });

  it("renders rows with escaped names, status text and formatted totals", async () => {
    mocks.listProjects.mockResolvedValue([
      {
        id: PROJECT_ID,
        name: "<img src=x onerror=alert(1)>",
        status: "on_hold",
        currency: "GBP",
        totalAmountMinor: 123456,
        client: { id: CLIENT_ID, displayName: "Kōwhai Studio" },
        plan: { allocated: 123456, unallocated: 0, balanced: true },
      },
    ]);
    const markup = await render();
    expect(markup).not.toContain("<img src=x");
    expect(markup).toContain("On hold");
    expect(markup).toContain("£1,234.56");
    expect(markup).toContain("Balanced");
  });

  it("stops before any query when signed out", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT /login"));
    await expect(render()).rejects.toThrow("NEXT_REDIRECT /login");
    expect(mocks.listProjects).not.toHaveBeenCalled();
  });
});

describe("new project page", () => {
  const render = async (clientId?: string | string[]) =>
    renderToStaticMarkup(await NewProjectPage({ searchParams: Promise.resolve({ clientId }) }));
  const client = { id: CLIENT_ID, displayName: "Kōwhai Studio", defaultCurrency: "AUD" };

  it("asks for a client first when there are no active clients", async () => {
    const markup = await render();
    expect(mocks.listProjectClients).toHaveBeenCalledWith(OWNER_ID);
    expect(markup).toContain("Add a client first");
    expect(markup).toContain('href="/dashboard/clients/new"');
  });

  it("preselects a client from the owner's list, with its currency", async () => {
    mocks.listProjectClients.mockResolvedValue([client]);
    const markup = await render(CLIENT_ID);
    expect(markup).toMatch(new RegExp(`<option value="${CLIENT_ID}" selected="">`));
    expect(markup).toContain('<option value="AUD" selected="">');
  });

  it.each(["11111111-1111-4111-8111-111111111111", "not-a-uuid", [CLIENT_ID]])("ignores an unknown clientId %j", async (clientId) => {
    mocks.listProjectClients.mockResolvedValue([client]);
    const markup = await render(clientId);
    expect(markup).not.toContain(`<option value="${CLIENT_ID}" selected="">`);
    expect(markup).toContain('<option value="" selected="">Choose a client</option>');
  });
});

describe("project page", () => {
  it("shows the plan, figures and why the draft cannot activate yet", async () => {
    const markup = renderToStaticMarkup(await ProjectPage(params()));
    expect(mocks.getProjectView).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID);
    expect(markup).toContain("still to allocate");
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain("30%");
    expect(markup).toContain("Fixed");
    expect(markup).toContain("Unbilled");
    expect(markup).toContain("1 Mar 2026");
    expect(markup).toContain(`href="/dashboard/projects/${PROJECT_ID}/plan"`);
    expect(markup).not.toContain(OWNER_ID);
  });

  it("explains an empty draft plan", async () => {
    mocks.getProjectView.mockResolvedValue(view({ milestones: [], plan: { allocated: 0, unallocated: 5000000, balanced: false } }));
    const markup = renderToStaticMarkup(await ProjectPage(params()));
    expect(markup).toContain("No milestones yet.");
    expect(markup).toContain("once it has a payment plan");
  });

  it("hides the plan editor link once the project is completed", async () => {
    mocks.getProjectView.mockResolvedValue(view({ status: "completed" }));
    expect(renderToStaticMarkup(await ProjectPage(params()))).not.toContain("/plan");
  });

  it("renders user text as escaped text", async () => {
    mocks.getProjectView.mockResolvedValue(view({ name: "<b>x</b>", description: "<script>alert(1)</script>" }));
    const markup = renderToStaticMarkup(await ProjectPage(params()));
    expect(markup).not.toContain("<b>x</b>");
    expect(markup).not.toContain("<script>");
  });

  it.each([ProjectPage, PlanPage, SettingsPage])("turns NotFound into the scoped 404", async (Page) => {
    mocks.getProjectView.mockRejectedValue(new NotFoundError());
    await expect(Page(params("not-a-uuid"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("lets unexpected errors reach the error boundary", async () => {
    const failure = new Error("database unavailable");
    mocks.getProjectView.mockRejectedValue(failure);
    await expect(ProjectPage(params())).rejects.toBe(failure);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});

describe("plan editor page", () => {
  it("offers the preset only for an empty draft", async () => {
    expect(renderToStaticMarkup(await PlanPage(params()))).not.toContain("Start from a preset");
    mocks.getProjectView.mockResolvedValue(view({ milestones: [] }));
    expect(renderToStaticMarkup(await PlanPage(params()))).toContain("Start from a preset");
  });

  it("offers no second deposit while one exists", async () => {
    const markup = renderToStaticMarkup(await PlanPage(params()));
    expect(markup).not.toContain('id="new-milestone-trigger"');
  });

  it("offers Delete in a draft and Cancel once active", async () => {
    expect(renderToStaticMarkup(await PlanPage(params()))).toContain("Delete Build");
    mocks.getProjectView.mockResolvedValue(view({ status: "active" }));
    const markup = renderToStaticMarkup(await PlanPage(params()));
    expect(markup).toContain("Cancel Build");
    expect(markup).not.toContain("Delete Build");
  });

  it.each(["completed", "cancelled"])("redirects a %s project to its page", async (status) => {
    mocks.getProjectView.mockResolvedValue(view({ status }));
    await expect(PlanPage(params())).rejects.toThrow(`NEXT_REDIRECT /dashboard/projects/${PROJECT_ID}`);
  });
});

describe("project settings page", () => {
  it("shows activate disabled with its reason and the draft delete", async () => {
    const markup = renderToStaticMarkup(await SettingsPage(params()));
    expect(markup).toMatch(/disabled="" aria-describedby="status-reason-activate"/);
    expect(markup).toContain("Balance the payment plan first.");
    expect(markup).toContain("Delete draft");
    expect(markup).toContain('value="50000.00"');
  });

  it("locks the details of a completed project and offers reopen only", async () => {
    mocks.getProjectView.mockResolvedValue(view({ status: "completed" }));
    const markup = renderToStaticMarkup(await SettingsPage(params()));
    expect(markup).toContain("Reopen project");
    expect(markup).toContain("locked");
    expect(markup).not.toContain("Save changes");
    expect(markup).not.toContain("Delete draft");
  });
});
