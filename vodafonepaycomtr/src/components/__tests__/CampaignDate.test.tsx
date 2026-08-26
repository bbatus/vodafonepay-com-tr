import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CampaignDate } from "@/components/CampaignDate";

describe("CampaignDate", () => {
  it("renders nothing when neither date is set", () => {
    const { container } = render(<CampaignDate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a full range when both dates are set", () => {
    render(<CampaignDate startDate="2026-07-14" endDate="2026-08-15" />);
    expect(screen.getByText(/14\.07\.2026 - 15\.08\.2026/)).toBeInTheDocument();
  });

  it("reads as open-ended when only a start date is set", () => {
    render(<CampaignDate startDate="2026-07-14" />);
    expect(screen.getByText(/14\.07\.2026 tarihinden itibaren/)).toBeInTheDocument();
  });

  it("reads as a deadline when only an end date is set", () => {
    render(<CampaignDate endDate="2026-08-15" />);
    expect(screen.getByText(/15\.08\.2026 tarihine kadar/)).toBeInTheDocument();
  });
});
