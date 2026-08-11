import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterTabs, matchesFilter } from "@/components/FilterTabs";

describe("FilterTabs", () => {
  it("renders all filter options", () => {
    render(<FilterTabs active="Tümü" onChange={() => {}} />);
    expect(screen.getByText("Tümü")).toBeInTheDocument();
    expect(screen.getByText("Anında Bakiye")).toBeInTheDocument();
    expect(screen.getByText("Faturana Yansıt")).toBeInTheDocument();
    expect(screen.getByText("Kart")).toBeInTheDocument();
  });

  it("marks the active prop's filter as active", () => {
    render(<FilterTabs active="Kart" onChange={() => {}} />);
    expect(screen.getByText("Kart").className).toContain("bg-vf-navy");
    expect(screen.getByText("Tümü").className).not.toContain("bg-vf-navy");
  });

  it("calls onChange with the clicked filter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterTabs active="Tümü" onChange={onChange} />);

    await user.click(screen.getByText("Kart"));
    expect(onChange).toHaveBeenCalledWith("Kart");
  });

  it("is not hidden on small screens (no hidden/lg:flex classes)", () => {
    const { container } = render(<FilterTabs active="Tümü" onChange={() => {}} />);
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).not.toHaveClass("hidden");
  });
});

describe("matchesFilter", () => {
  it("always matches when active is Tümü", () => {
    expect(matchesFilter("Tümü", undefined)).toBe(true);
    expect(matchesFilter("Tümü", "kart")).toBe(true);
  });

  it("does not match when category is missing and active is a specific filter", () => {
    expect(matchesFilter("Kart", undefined)).toBe(false);
  });

  it("matches CMS category values to the corresponding filter label", () => {
    expect(matchesFilter("Anında Bakiye", "aninda-bakiye")).toBe(true);
    expect(matchesFilter("Faturana Yansıt", "faturana-yansit")).toBe(true);
    expect(matchesFilter("Kart", "kart")).toBe(true);
    expect(matchesFilter("Kart", "aninda-bakiye")).toBe(false);
  });

  it("does not match an unrecognized category value", () => {
    expect(matchesFilter("Kart", "genel")).toBe(false);
  });
});
