// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AccessMatrixApp from "@/components/AccessMatrixApp";

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
  vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccessMatrixApp", () => {
  it("renders a matrix with every real collection and role from getAccessMatrixRows", () => {
    render(<AccessMatrixApp />);
    expect(screen.getByText("Koleksiyon")).toBeInTheDocument();
    expect(screen.getAllByText("✓").length + screen.getAllByText("✗").length).toBeGreaterThan(0);
  });

  it("filters rows by search query", () => {
    render(<AccessMatrixApp />);
    const search = screen.getByPlaceholderText("Koleksiyon ara…");
    fireEvent.change(search, { target: { value: "campaigns" } });
    expect(screen.getByText("campaigns")).toBeInTheDocument();
    expect(screen.queryByText("users")).not.toBeInTheDocument();
  });

  it("shows the no-match empty state when the search matches nothing", () => {
    render(<AccessMatrixApp />);
    const search = screen.getByPlaceholderText("Koleksiyon ara…");
    fireEvent.change(search, { target: { value: "___no_such_collection___" } });
    expect(screen.getByText("Aramanızla eşleşen koleksiyon yok.")).toBeInTheDocument();
  });

  it("exports a CSV on button click", () => {
    render(<AccessMatrixApp />);
    fireEvent.click(screen.getByRole("button", { name: "Dışa Aktar (CSV)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
