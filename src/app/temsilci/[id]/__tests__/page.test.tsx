import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TemsilciDetay, { generateMetadata } from "@/app/temsilci/[id]/page";
import { getRepresentativeById } from "@/lib/cms";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getRepresentativeById: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

const rep = {
  id: "42",
  businessName: "İşletme A",
  repCode: "REP-1",
  activityDescription: "Faaliyet",
  phone: "0000",
  mersisNo: "123",
  address: "Adres",
  province: "İl",
  district: "İlçe",
  authorizedPerson: "Yetkili Kişi",
  qrCode: undefined,
};

describe("generateMetadata", () => {
  it("returns an empty object when the id matches no representative", async () => {
    vi.mocked(getRepresentativeById).mockResolvedValue(null);
    expect(await generateMetadata({ params: Promise.resolve({ id: "yok" }) })).toEqual({});
  });
});

describe("TemsilciDetay", () => {
  it("calls notFound() when no representative matches the id", async () => {
    vi.mocked(getRepresentativeById).mockResolvedValue(null);
    await expect(TemsilciDetay({ params: Promise.resolve({ id: "yok" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders every optional field when present", async () => {
    vi.mocked(getRepresentativeById).mockResolvedValue(rep as never);

    render(await TemsilciDetay({ params: Promise.resolve({ id: "42" }) }));

    expect(screen.getByRole("heading", { name: "İşletme A" })).toBeInTheDocument();
    expect(screen.getByText(/REP-1/)).toBeInTheDocument();
    expect(screen.getByText("Yetkili Kişi")).toBeInTheDocument();
  });

  it("omits optional field rows when unset", async () => {
    vi.mocked(getRepresentativeById).mockResolvedValue({
      ...rep,
      repCode: undefined,
      phone: undefined,
      activityDescription: undefined,
      authorizedPerson: undefined,
      mersisNo: undefined,
    } as never);

    render(await TemsilciDetay({ params: Promise.resolve({ id: "42" }) }));

    expect(screen.queryByText("Telefon")).not.toBeInTheDocument();
    expect(screen.queryByText("Yetkili")).not.toBeInTheDocument();
  });
});
