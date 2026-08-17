import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ALL_FILTER, FilterTabs, matchesFilter } from "@/components/FilterTabs";

const categories = [
  { label: "Anında Bakiye", slug: "aninda-bakiye" },
  { label: "Faturana Yansıt", slug: "faturana-yansit" },
  { label: "Kart", slug: "kart" },
];

describe("FilterTabs", () => {
  it("renders Tümü plus every passed-in category", () => {
    render(<FilterTabs categories={categories} active={ALL_FILTER} onChange={() => {}} />);
    expect(screen.getByText("Tümü")).toBeInTheDocument();
    expect(screen.getByText("Anında Bakiye")).toBeInTheDocument();
    expect(screen.getByText("Faturana Yansıt")).toBeInTheDocument();
    expect(screen.getByText("Kart")).toBeInTheDocument();
  });

  it("renders only Tümü when categories is empty", () => {
    render(<FilterTabs categories={[]} active={ALL_FILTER} onChange={() => {}} />);
    expect(screen.getByText("Tümü")).toBeInTheDocument();
    expect(screen.queryByText("Kart")).not.toBeInTheDocument();
  });

  it("marks the active prop's filter as active", () => {
    render(<FilterTabs categories={categories} active="kart" onChange={() => {}} />);
    expect(screen.getByText("Kart").className).toContain("bg-vf-navy");
    expect(screen.getByText("Tümü").className).not.toContain("bg-vf-navy");
  });

  it("calls onChange with the clicked category's slug", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterTabs categories={categories} active={ALL_FILTER} onChange={onChange} />);

    await user.click(screen.getByText("Kart"));
    expect(onChange).toHaveBeenCalledWith("kart");
  });

  it("is not hidden on small screens (no hidden/lg:flex classes)", () => {
    const { container } = render(<FilterTabs categories={categories} active={ALL_FILTER} onChange={() => {}} />);
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).not.toHaveClass("hidden");
  });
});

describe("matchesFilter", () => {
  it("always matches when active is the 'all' sentinel", () => {
    expect(matchesFilter(ALL_FILTER, undefined)).toBe(true);
    expect(matchesFilter(ALL_FILTER, "kart")).toBe(true);
  });

  it("does not match when category is missing and active is a specific slug", () => {
    expect(matchesFilter("kart", undefined)).toBe(false);
  });

  it("matches by direct slug comparison — no label indirection", () => {
    expect(matchesFilter("aninda-bakiye", "aninda-bakiye")).toBe(true);
    expect(matchesFilter("faturana-yansit", "faturana-yansit")).toBe(true);
    expect(matchesFilter("kart", "kart")).toBe(true);
    expect(matchesFilter("kart", "aninda-bakiye")).toBe(false);
  });

  it("does not match an unrecognized category value", () => {
    expect(matchesFilter("kart", "genel")).toBe(false);
  });
});
