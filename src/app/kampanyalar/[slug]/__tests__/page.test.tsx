import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KampanyaDetay, { generateMetadata, generateStaticParams } from "@/app/kampanyalar/[slug]/page";
import { getCampaignBySlug, getCampaigns } from "@/lib/cms";

const { notFoundMock, draftModeMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  draftModeMock: vi.fn(async () => ({ isEnabled: false })),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("next/headers", () => ({ draftMode: draftModeMock }));

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getCampaignBySlug: vi.fn(), getCampaigns: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

const campaign = {
  id: "1",
  title: "Yaz Kampanyası",
  slug: "yaz-kampanyasi",
  description: "Açıklama",
  image: { url: "/a.jpg", alt: "a" },
  category: { label: "Kart", slug: "kart" },
  body: null,
  terms: null,
  seoTitle: undefined,
  seoDescription: undefined,
  seoKeywords: undefined,
  startDate: undefined,
  endDate: undefined,
  ctaLabel: undefined,
  ctaUrl: undefined,
};

describe("generateStaticParams", () => {
  it("only includes campaigns that have a slug", async () => {
    vi.mocked(getCampaigns).mockResolvedValue([
      { ...campaign, slug: "var-slug" },
      { ...campaign, slug: undefined },
    ] as never);

    expect(await generateStaticParams()).toEqual([{ slug: "var-slug" }]);
  });
});

describe("generateMetadata", () => {
  it("returns an empty object when the slug matches no campaign", async () => {
    vi.mocked(getCampaignBySlug).mockResolvedValue(null);
    expect(await generateMetadata({ params: Promise.resolve({ slug: "yok" }) })).toEqual({});
  });
});

describe("KampanyaDetay", () => {
  it("calls notFound() when no campaign matches the slug", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    vi.mocked(getCampaignBySlug).mockResolvedValue(null);

    await expect(KampanyaDetay({ params: Promise.resolve({ slug: "yok" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the campaign's title/description and no PreviewBanner outside draft mode", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    vi.mocked(getCampaignBySlug).mockResolvedValue(campaign as never);

    render(await KampanyaDetay({ params: Promise.resolve({ slug: "yaz-kampanyasi" }) }));

    expect(screen.getByRole("heading", { name: "Yaz Kampanyası" })).toBeInTheDocument();
    expect(screen.queryByText("Önizlemeden çık")).not.toBeInTheDocument();
  });

  it("shows the PreviewBanner and fetches draft content when draft mode is enabled", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true });
    vi.mocked(getCampaignBySlug).mockResolvedValue(campaign as never);
    vi.stubEnv("PREVIEW_SECRET", "s");

    render(await KampanyaDetay({ params: Promise.resolve({ slug: "yaz-kampanyasi" }) }));

    expect(screen.getByText("Önizlemeden çık")).toBeInTheDocument();
    expect(getCampaignBySlug).toHaveBeenCalledWith("yaz-kampanyasi", { preview: true });
    vi.unstubAllEnvs();
  });

  it("renders the rich-text body/terms sections only when they carry real content", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    vi.mocked(getCampaignBySlug).mockResolvedValue({
      ...campaign,
      terms: { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "Şart 1" }] }] } },
    } as never);

    render(await KampanyaDetay({ params: Promise.resolve({ slug: "yaz-kampanyasi" }) }));

    expect(screen.getByText("Kampanya Koşulları")).toBeInTheDocument();
    expect(screen.getByText("Şart 1")).toBeInTheDocument();
  });
});
