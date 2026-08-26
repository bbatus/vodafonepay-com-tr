import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GizlilikVeGuvenlikPolitikasi from "@/app/gizlilik-ve-guvenlik-politikasi/page";
import { getLegalPage, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("GizlilikVeGuvenlikPolitikasi", () => {
  it("uses the fallback intro paragraph when the CMS has no legal page", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await GizlilikVeGuvenlikPolitikasi());

    // The page's own hardcoded (never-CMS) sections mention "6698 sayılı..."
    // too, so match on wording unique to fallbackIntro specifically.
    expect(screen.getByText(/veri sorumlusu sıfatıyla, hizmet aldığınız Vodafone/)).toBeInTheDocument();
  });

  it("renders the CMS-edited intro (RichText) instead of the fallback when a legal page exists", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "gizlilik-ve-guvenlik-politikasi",
      title: "T",
      intro: { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "CMS metni" }] }] } },
      heroImage: null,
      groups: [],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await GizlilikVeGuvenlikPolitikasi());

    expect(screen.getByText("CMS metni")).toBeInTheDocument();
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

    render(await GizlilikVeGuvenlikPolitikasi());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
