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
  // Follow-up 28.08: the hardcoded fallback is gone — the body lives in the
  // `legal-pages` collection now, so an empty/unreachable CMS must render an
  // honestly empty section rather than a stale copy of the real content.
  it("renders no intro paragraph when the CMS has no legal page", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await GizlilikVeGuvenlikPolitikasi());

    // Wording that was unique to the removed fallbackIntro array.
    expect(screen.queryByText(/veri sorumlusu sıfatıyla, hizmet aldığınız Vodafone/)).not.toBeInTheDocument();
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

  it("renders the related-link CTA when the legal page has a deeplink", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "gizlilik-ve-guvenlik-politikasi",
      title: "T",
      intro: null,
      heroImage: null,
      groups: [],
      deeplink: "/kampanyalar",
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await GizlilikVeGuvenlikPolitikasi());

    expect(screen.getByText("İlgili bağlantı →").closest("a")).toHaveAttribute("href", "/kampanyalar");
  });
});
