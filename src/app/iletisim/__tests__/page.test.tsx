import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Iletisim from "@/app/iletisim/page";
import { getContactInfo, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getContactInfo: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("Iletisim", () => {
  it("falls back to the hardcoded contact info when the CMS global is unset", async () => {
    vi.mocked(getContactInfo).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await Iletisim());

    expect(screen.getByText("605026-0")).toBeInTheDocument();
    // pressRelationsUrl is set on the fallback — its row should render.
    expect(screen.getByText("medyamerkezi.vodafone.com.tr/")).toBeInTheDocument();
  });

  it("omits the press-relations row entirely when pressRelationsUrl is unset (CMS or fallback)", async () => {
    vi.mocked(getContactInfo).mockResolvedValue({
      companyName: "CMS Şirket",
      tradeRegistryNo: "1",
      address: "Adres",
      phone: "0000",
      kepAddress: "kep",
      customerServiceText: "Satır 1\nSatır 2",
      tcmbAddress: "TCMB Adres",
      tcmbPhone: "tel",
      tcmbFax: "faks",
      tcmbKep: "kep",
      pressRelationsUrl: undefined,
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await Iletisim());

    expect(screen.getByText("CMS Şirket")).toBeInTheDocument();
    expect(screen.queryByText("Basın Bültenleri ve Medya İlişkileri")).not.toBeInTheDocument();
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

    render(await Iletisim());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
