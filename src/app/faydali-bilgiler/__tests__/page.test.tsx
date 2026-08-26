import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FaydaliBilgiler from "@/app/faydali-bilgiler/page";
import { getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("FaydaliBilgiler", () => {
  it("renders the heading and the accordion", async () => {
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await FaydaliBilgiler());

    expect(screen.getByRole("heading", { name: "Faydalı Bilgiler", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Cüzdan kodu ile/)).toBeInTheDocument();
  });

  it("uses the CMS breadcrumb label over the default when set", async () => {
    vi.mocked(getPageMeta).mockResolvedValue({
      id: "1",
      pageKey: "/faydali-bilgiler",
      breadcrumbLabel: "CMS Etiketi",
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
    } as never);

    render(await FaydaliBilgiler());

    expect(screen.getByText("CMS Etiketi")).toBeInTheDocument();
  });
});
