import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemsilciliklerimizForm } from "../TemsilciliklerimizForm";

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

  it("enables Bul only once both province and district are selected, and opens a maps search", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<TemsilciliklerimizForm />);

    const bulButton = screen.getByRole("button", { name: "Bul" });
    expect(bulButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("İl"), "İSTANBUL");
    expect(bulButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("İlçe"), "Kadıköy");
    expect(bulButton).toBeEnabled();

    await user.click(bulButton);
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
