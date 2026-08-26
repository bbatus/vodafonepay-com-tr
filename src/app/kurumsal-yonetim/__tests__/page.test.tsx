import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KurumsalYonetim from "@/app/kurumsal-yonetim/page";
import { getContactInfo, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getContactInfo: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("KurumsalYonetim", () => {
  it("falls back to the hardcoded company registry info when the CMS has none", async () => {
    vi.mocked(getContactInfo).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await KurumsalYonetim());

    expect(screen.getByText("Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş.")).toBeInTheDocument();
  });

  it("uses the CMS ContactInfo global's fields over the fallback when present", async () => {
    vi.mocked(getContactInfo).mockResolvedValue({
      companyName: "CMS Şirket Adı",
      tradeRegistryNo: "1",
      address: "Adres",
      phone: "0000",
      kepAddress: "kep",
      customerServiceText: "cs",
      tcmbAddress: "tcmb",
      tcmbPhone: "tel",
      tcmbFax: "faks",
      tcmbKep: "kep",
      pressRelationsUrl: undefined,
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await KurumsalYonetim());

    expect(screen.getByText("CMS Şirket Adı")).toBeInTheDocument();
    expect(screen.queryByText("Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş.")).not.toBeInTheDocument();
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

    render(await KurumsalYonetim());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
