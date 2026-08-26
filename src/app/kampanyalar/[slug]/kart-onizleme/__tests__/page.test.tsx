import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KampanyaKartOnizleme from "@/app/kampanyalar/[slug]/kart-onizleme/page";
import { getCampaignBySlug } from "@/lib/cms";

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
  return { ...actual, getCampaignBySlug: vi.fn() };
});

describe("KampanyaKartOnizleme", () => {
  it("calls notFound() when no campaign matches the slug", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    vi.mocked(getCampaignBySlug).mockResolvedValue(null);

    await expect(KampanyaKartOnizleme({ params: Promise.resolve({ slug: "yok" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the single campaign card exactly as the listing page would, no PreviewBanner outside draft mode", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false });
    vi.mocked(getCampaignBySlug).mockResolvedValue({
      id: "1",
      title: "Yaz Kampanyası",
      slug: "yaz-kampanyasi",
      description: "Açıklama",
      image: { url: "/a.jpg", alt: "a" },
      category: { label: "Kart", slug: "kart" },
      ctaLabel: undefined,
    } as never);

    render(await KampanyaKartOnizleme({ params: Promise.resolve({ slug: "yaz-kampanyasi" }) }));

    expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument();
    expect(screen.queryByText("Önizlemeden çık")).not.toBeInTheDocument();
  });

  it("shows the PreviewBanner in draft mode", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true });
    vi.mocked(getCampaignBySlug).mockResolvedValue({
      id: "1",
      title: "Yaz Kampanyası",
      slug: "yaz-kampanyasi",
      description: "Açıklama",
      image: { url: "/a.jpg", alt: "a" },
      category: null,
      ctaLabel: undefined,
    } as never);
    vi.stubEnv("PREVIEW_SECRET", "s");

    render(await KampanyaKartOnizleme({ params: Promise.resolve({ slug: "yaz-kampanyasi" }) }));

    expect(screen.getByText("Önizlemeden çık")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
