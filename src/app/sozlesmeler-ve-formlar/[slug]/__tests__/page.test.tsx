import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SozlesmeDetay, { generateMetadata, generateStaticParams } from "@/app/sozlesmeler-ve-formlar/[slug]/page";
import { getLegalPage } from "@/lib/cms";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

const legalPage = {
  id: "1",
  slug: "sozlesmeler-ve-formlar",
  title: "T",
  intro: null,
  heroImage: null,
  groups: [
    {
      label: "Belgeler",
      documents: [
        { prefix: null, label: "Üyelik Sözleşmesi", source: "page", slug: "uyelik-sozlesmesi", enabled: true, file: undefined, body: null },
        { prefix: null, label: "Devre Dışı", source: "page", slug: "devre-disi", enabled: false, file: undefined, body: null },
      ],
    },
  ],
};

describe("generateStaticParams", () => {
  it("only includes enabled 'page' documents that have a slug", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);
    expect(await generateStaticParams()).toEqual([{ slug: "uyelik-sozlesmesi" }]);
  });

  it("returns an empty array when there is no legal page", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    expect(await generateStaticParams()).toEqual([]);
  });
});

describe("generateMetadata", () => {
  it("falls back to the generic title when no document matches the slug", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "yok" }) });
    expect(meta.title).toBe("Sözleşmeler ve Formlar | Vodafone Pay");
  });

  it("uses the matched document's label as the title", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "uyelik-sozlesmesi" }) });
    expect(meta.title).toBe("Üyelik Sözleşmesi | Vodafone Pay");
  });
});

describe("SozlesmeDetay", () => {
  it("calls notFound() when no document matches the slug", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);
    await expect(SozlesmeDetay({ params: Promise.resolve({ slug: "yok" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound() for a disabled document even if the slug matches", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);
    await expect(SozlesmeDetay({ params: Promise.resolve({ slug: "devre-disi" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the matched document's label and group label", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(legalPage as never);

    render(await SozlesmeDetay({ params: Promise.resolve({ slug: "uyelik-sozlesmesi" }) }));

    expect(screen.getByRole("heading", { name: "Üyelik Sözleşmesi" })).toBeInTheDocument();
    expect(screen.getByText("Belgeler")).toBeInTheDocument();
    expect(screen.getByText("← Sözleşmeler ve Formlar")).toHaveAttribute("href", "/sozlesmeler-ve-formlar");
  });
});
