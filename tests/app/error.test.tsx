import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootError from "@/app/error";
import DashboardError from "@/app/dashboard/error";

describe("unexpected-error fallbacks", () => {
  it("gives the parent fallback a main target while withholding raw error details", () => {
    const privateDetail = "private-token-email-cookie";
    const markup = renderToStaticMarkup(
      <RootError error={new Error(privateDetail)} reset={vi.fn()} retry={vi.fn()} />,
    );

    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain('<main id="main-content"');
    expect(markup).toContain('aria-labelledby="error-heading"');
    expect(markup).toContain("Try again");
    expect(markup).not.toContain(privateDetail);
  });

  it("keeps page fallback details generic without nesting another main landmark", () => {
    const markup = renderToStaticMarkup(
      <DashboardError error={"provider-private-detail"} reset={vi.fn()} retry={vi.fn()} />,
    );

    expect(markup).not.toContain("provider-private-detail");
    expect(markup).not.toContain("<main");
    expect(markup).toContain("Try again");
  });
});
