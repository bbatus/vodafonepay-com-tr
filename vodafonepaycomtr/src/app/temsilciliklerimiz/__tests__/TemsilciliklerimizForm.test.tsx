import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemsilciliklerimizForm } from "../TemsilciliklerimizForm";
import type { CmsRepresentative } from "@/lib/cms";

const rep = (overrides: Partial<CmsRepresentative> = {}): CmsRepresentative => ({
  id: "1",
  businessName: "Kadıköy Vodafone Mağazası",
  repCode: undefined,
  activityDescription: undefined,
  phone: undefined,
  mersisNo: undefined,
  address: "Bahariye Cad. No:1",
  province: "İSTANBUL",
  district: "Kadıköy",
  authorizedPerson: undefined,
  qrCode: undefined,
  ...overrides,
});

describe("TemsilciliklerimizForm", () => {
  it("disables the district select and the Bul button until a province is chosen", () => {
    render(<TemsilciliklerimizForm />);
    expect(screen.getByLabelText("İlçe")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bul" })).toBeDisabled();
  });

  it("populates real districts once a province is selected", async () => {
    const user = userEvent.setup();
    render(<TemsilciliklerimizForm />);

    await user.selectOptions(screen.getByLabelText("İl"), "İSTANBUL");
    expect(screen.getByLabelText("İlçe")).toBeEnabled();
    expect(screen.getByRole("option", { name: "Kadıköy" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Üsküdar" })).toBeInTheDocument();
  });

  it("resets the district when the province changes", async () => {
    const user = userEvent.setup();
    render(<TemsilciliklerimizForm />);

    await user.selectOptions(screen.getByLabelText("İl"), "İSTANBUL");
    await user.selectOptions(screen.getByLabelText("İlçe"), "Kadıköy");
    await user.selectOptions(screen.getByLabelText("İl"), "ANKARA");

    expect(screen.getByLabelText("İlçe")).toHaveValue("");
    expect(screen.queryByRole("option", { name: "Kadıköy" })).not.toBeInTheDocument();
  });

  it("enables Bul only once both province and district are selected, and lists matching representatives", async () => {
    const user = userEvent.setup();
    render(<TemsilciliklerimizForm representatives={[rep()]} />);

    const bulButton = screen.getByRole("button", { name: "Bul" });
    expect(bulButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("İl"), "İSTANBUL");
    expect(bulButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("İlçe"), "Kadıköy");
    expect(bulButton).toBeEnabled();

    await user.click(bulButton);
    expect(screen.getByText("Kadıköy Vodafone Mağazası")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kadıköy Vodafone Mağazası/ })).toHaveAttribute("href", "/temsilci/1");
  });

  it("shows a no-results message and a maps fallback when nothing matches", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<TemsilciliklerimizForm representatives={[]} />);

    await user.selectOptions(screen.getByLabelText("İl"), "İSTANBUL");
    await user.selectOptions(screen.getByLabelText("İlçe"), "Kadıköy");
    await user.click(screen.getByRole("button", { name: "Bul" }));

    expect(screen.getByText(/kayıtlı bir temsilcilik bulunamadı/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Haritada ara →" }));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("Vodafone Mağaza Kadıköy İSTANBUL")),
      "_blank",
      "noopener,noreferrer"
    );

    openSpy.mockRestore();
  });

  it("lists all 81 provinces", () => {
    render(<TemsilciliklerimizForm />);
    const options = screen.getAllByRole("option").filter((o) => o.closest("#il"));
    // +1 for the "İl seçiniz" placeholder
    expect(options).toHaveLength(82);
  });
});
