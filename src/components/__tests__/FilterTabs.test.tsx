import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterTabs } from "@/components/FilterTabs";

describe("FilterTabs", () => {
  it("renders all filter options", () => {
    render(<FilterTabs />);
    expect(screen.getByText("Tümü")).toBeInTheDocument();
    expect(screen.getByText("Anında Bakiye")).toBeInTheDocument();
    expect(screen.getByText("Faturana Yansıt")).toBeInTheDocument();
    expect(screen.getByText("Kart")).toBeInTheDocument();
  });

  it("marks the clicked filter as active", async () => {
    const user = userEvent.setup();
    render(<FilterTabs />);

    const kartButton = screen.getByText("Kart");
    await user.click(kartButton);
    expect(kartButton.className).toContain("bg-vf-navy");
  });
});
