import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UcretlerVeLimitler from "@/app/ucretler-ve-limitler/page";
import { getFeeRows, getLimitTables, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getFeeRows: vi.fn(), getLimitTables: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("UcretlerVeLimitler", () => {
  it("shows the CMS-unreachable error state when both fetches fail", async () => {
    vi.mocked(getFeeRows).mockResolvedValue(null);
    vi.mocked(getLimitTables).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await UcretlerVeLimitler());

    expect(screen.getByText(/şu anda yüklenemiyor/)).toBeInTheDocument();
  });

  it("shows the genuinely-empty state when both are reachable but empty", async () => {
    vi.mocked(getFeeRows).mockResolvedValue([]);
    vi.mocked(getLimitTables).mockResolvedValue([]);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await UcretlerVeLimitler());

    expect(screen.getByText("Şu anda gösterilecek içerik yok.")).toBeInTheDocument();
  });

  it("renders the fee/limit tables when data exists", async () => {
    vi.mocked(getFeeRows).mockResolvedValue([{ id: "1", label: "Aidat", value: "10 TL", order: 0 }] as never);
    vi.mocked(getLimitTables).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await UcretlerVeLimitler());

    expect(screen.getByText("Aidat")).toBeInTheDocument();
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

    render(await UcretlerVeLimitler());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
