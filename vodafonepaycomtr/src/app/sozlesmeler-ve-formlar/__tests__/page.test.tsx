import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SozlesmelerVeFormlar from "@/app/sozlesmeler-ve-formlar/page";
import { getLegalPage, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("SozlesmelerVeFormlar", () => {
  it("falls back to the hardcoded document group when the CMS has no legal page", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SozlesmelerVeFormlar());

    expect(screen.getByRole("heading", { name: "Sözleşmeler ve Formlar" })).toBeInTheDocument();
    expect(screen.getByText(/Tüketici Hakları Bilgi Formu için/)).toBeInTheDocument();
  });

  it("resolves a CMS 'page' document to an internal /sozlesmeler-ve-formlar/{slug} link", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "sozlesmeler-ve-formlar",
      title: "Sözleşmeler ve Formlar",
      intro: null,
      heroImage: null,
      groups: [
        {
          label: "Belgeler",
          documents: [
            { prefix: null, label: "Üyelik Sözleşmesi", source: "page", slug: "uyelik-sozlesmesi", enabled: true, file: undefined },
          ],
        },
      ],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SozlesmelerVeFormlar());

    const link = screen.getByText("Üyelik Sözleşmesi");
    expect(link).toHaveAttribute("href", "/sozlesmeler-ve-formlar/uyelik-sozlesmesi");
  });

  it("skips a 'pdf' document row with no usable file rather than rendering a dead link", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "sozlesmeler-ve-formlar",
      title: "Sözleşmeler ve Formlar",
      intro: null,
      heroImage: null,
      groups: [{ label: "Belgeler", documents: [{ prefix: null, label: "Eksik Belge", source: "pdf", slug: undefined, enabled: true, file: undefined }] }],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SozlesmelerVeFormlar());

    expect(screen.queryByText("Eksik Belge")).not.toBeInTheDocument();
  });

  it("skips a disabled document row entirely", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "sozlesmeler-ve-formlar",
      title: "Sözleşmeler ve Formlar",
      intro: null,
      heroImage: null,
      groups: [
        {
          label: "Belgeler",
          documents: [{ prefix: null, label: "Devre Dışı", source: "page", slug: "devre-disi", enabled: false, file: undefined }],
        },
      ],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SozlesmelerVeFormlar());

    expect(screen.queryByText("Devre Dışı")).not.toBeInTheDocument();
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

    render(await SozlesmelerVeFormlar());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });

  it("renders the related-link CTA when the legal page has a deeplink", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "sozlesmeler-ve-formlar",
      title: "Sözleşmeler ve Formlar",
      intro: null,
      heroImage: null,
      groups: [],
      deeplink: "/kampanyalar",
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SozlesmelerVeFormlar());

    expect(screen.getByText("İlgili bağlantı →").closest("a")).toHaveAttribute("href", "/kampanyalar");
  });
});
