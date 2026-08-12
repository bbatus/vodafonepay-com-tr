import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PricesAndLimits } from "@/components/PricesAndLimits";

describe("PricesAndLimits", () => {
  it("shows the fee rows tab by default", () => {
    render(<PricesAndLimits />);
    expect(screen.getByText("Faturana Yansıt Hizmet Bedeli")).toBeInTheDocument();
  });

  it("switches to the limits tab on click", async () => {
    const user = userEvent.setup();
    render(<PricesAndLimits />);

    await user.click(screen.getByText("Limitler"));
    expect(screen.getByText("Ön Ödemeli Kart / ATM Limitleri")).toBeInTheDocument();
    expect(screen.queryByText("Faturana Yansıt Hizmet Bedeli")).not.toBeInTheDocument();
  });

  it("renders custom feeRows/limitTables when provided", () => {
    render(
      <PricesAndLimits
        feeRows={[["Özel Ücret", "10 TL"]]}
        limitTables={[{ title: "Özel Limit", rows: [["A", "Günlük", "1", "2"]] }]}
      />
    );
    expect(screen.getByText("Özel Ücret")).toBeInTheDocument();
  });
});
