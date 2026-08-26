import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Temsilciliklerimiz from "@/app/temsilciliklerimiz/page";
import { getPageMeta, getRepresentatives } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getRepresentatives: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("Temsilciliklerimiz", () => {
  it("renders the page heading even when the CMS has no representatives", async () => {
    vi.mocked(getRepresentatives).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await Temsilciliklerimiz());

    expect(screen.getByRole("heading", { name: "Temsilciliklerimiz" })).toBeInTheDocument();
  });
  it("uses the CMS breadcrumbLabel override when set", async () => {
    vi.mocked(getPageMeta).mockResolvedValue({
      id: "1",
      pageKey: "/x",
      breadcrumbLabel: "CMS Kırıntı Etiketi",
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
    } as never);

    render(await Temsilciliklerimiz());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
