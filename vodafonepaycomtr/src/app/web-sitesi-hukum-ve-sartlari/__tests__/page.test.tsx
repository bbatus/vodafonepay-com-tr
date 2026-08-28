import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WebSitesiHukumVeSartlari from "@/app/web-sitesi-hukum-ve-sartlari/page";
import { getLegalPage, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("WebSitesiHukumVeSartlari", () => {
  it("falls back to the single hardcoded document entry when the CMS has none", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await WebSitesiHukumVeSartlari());

    expect(screen.getByText("Hüküm ve Şartlar için tıklayınız")).toBeInTheDocument();
  });

  it("lists CMS-provided document lines instead of the fallback when a legal page exists", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "web-sitesi-hukum-ve-sartlari",
      title: "T",
      intro: { root: { children: [{ type: "paragraph", children: [{ text: "CMS belgesi" }] }] } },
      heroImage: null,
      groups: [],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await WebSitesiHukumVeSartlari());

    expect(screen.getByText("CMS belgesi")).toBeInTheDocument();
    expect(screen.queryByText("Hüküm ve Şartlar için tıklayınız")).not.toBeInTheDocument();
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

    render(await WebSitesiHukumVeSartlari());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });

  it("renders the related-link CTA when the legal page has a deeplink", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "web-sitesi-hukum-ve-sartlari",
      title: "T",
      intro: null,
      heroImage: null,
      groups: [],
      deeplink: "/kampanyalar",
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await WebSitesiHukumVeSartlari());

    expect(screen.getByText("İlgili bağlantı →").closest("a")).toHaveAttribute("href", "/kampanyalar");
  });
});
