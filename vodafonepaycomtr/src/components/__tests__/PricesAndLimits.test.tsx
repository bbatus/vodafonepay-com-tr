import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PricesAndLimits } from "@/components/PricesAndLimits";

const feeRows: [string, string][] = [["Özel Ücret", "10 TL"]];
const limitTables = [{ title: "Özel Limit", rows: [["A", "Günlük", "1", "2"] as [string, string, string, string]] }];

describe("PricesAndLimits", () => {
  it("shows the fee rows tab by default", () => {
    render(<PricesAndLimits feeRows={feeRows} limitTables={limitTables} />);
    expect(screen.getByText("Özel Ücret")).toBeInTheDocument();
  });

  it("switches to the limits tab on click", async () => {
    const user = userEvent.setup();
    render(<PricesAndLimits feeRows={feeRows} limitTables={limitTables} />);

    await user.click(screen.getByText("Limitler"));
    expect(screen.getByText("Özel Limit")).toBeInTheDocument();
    expect(screen.queryByText("Özel Ücret")).not.toBeInTheDocument();
  });

  it("renders an empty table when a list is empty (no hardcoded fallback data)", () => {
    render(<PricesAndLimits feeRows={[]} limitTables={[]} />);
    expect(screen.queryByText("Faturana Yansıt Hizmet Bedeli")).not.toBeInTheDocument();
    expect(screen.queryByText("Ön Ödemeli Kart / ATM Limitleri")).not.toBeInTheDocument();
  });
});
