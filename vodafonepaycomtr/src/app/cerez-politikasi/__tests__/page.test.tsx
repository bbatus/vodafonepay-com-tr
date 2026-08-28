import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CerezPolitikasi from "@/app/cerez-politikasi/page";
import { getCookieRows, getLegalPage, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getCookieRows: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("CerezPolitikasi", () => {
  // Follow-up 28.08: the hardcoded 59-row fallback table is gone — the rows
  // live in the `cookie-rows` collection now, so an empty/unreachable CMS
  // must render an empty table rather than a stale copy of the real one.
  it("renders no cookie rows at all when the CMS has none", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getCookieRows).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    const { container } = render(await CerezPolitikasi());

    expect(screen.queryByText("_ga")).not.toBeInTheDocument();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });

  it("renders the CMS cookie rows", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getCookieRows).mockResolvedValue([
      { id: "1", name: "cms_cookie", provider: "vodafonepay.com.tr", party: "Birinci taraf", category: "Zorunlu", description: "d", duration: "1 Yıl" },
    ] as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await CerezPolitikasi());

    expect(screen.getByText("cms_cookie")).toBeInTheDocument();
    expect(screen.queryByText("_ga")).not.toBeInTheDocument();
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

    render(await CerezPolitikasi());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });

  it("renders the related-link CTA when the legal page has a deeplink", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "cerez-politikasi",
      title: "T",
      intro: null,
      heroImage: null,
      groups: [],
      deeplink: "/kampanyalar",
    } as never);
    vi.mocked(getCookieRows).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await CerezPolitikasi());

    expect(screen.getByText("İlgili bağlantı →").closest("a")).toHaveAttribute("href", "/kampanyalar");
  });
});
