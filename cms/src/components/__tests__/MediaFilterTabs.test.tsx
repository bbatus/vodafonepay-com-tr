// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MediaFilterTabs from "@/components/MediaFilterTabs";

const mockUseListQuery = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useListQuery: () => mockUseListQuery(),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MediaFilterTabs", () => {
  it("renders all 3 tabs with 'Tümü' active when no filter is set", () => {
    mockUseListQuery.mockReturnValue({ handleWhereChange: vi.fn(), query: {} });
    render(<MediaFilterTabs />);
    expect(screen.getByRole("button", { name: "Tümü" })).toHaveClass("media-filter-tabs__tab--active");
    expect(screen.getByRole("button", { name: "Görseller" })).not.toHaveClass("media-filter-tabs__tab--active");
  });

  it("marks 'Görseller' active when the list query is already filtered to images", () => {
    mockUseListQuery.mockReturnValue({ handleWhereChange: vi.fn(), query: { where: { mediaType: { equals: "image" } } } });
    render(<MediaFilterTabs />);
    expect(screen.getByRole("button", { name: "Görseller" })).toHaveClass("media-filter-tabs__tab--active");
  });

  it("clicking a tab calls handleWhereChange with the right filter", () => {
    const handleWhereChange = vi.fn();
    mockUseListQuery.mockReturnValue({ handleWhereChange, query: {} });
    render(<MediaFilterTabs />);

    fireEvent.click(screen.getByRole("button", { name: "Videolar" }));
    expect(handleWhereChange).toHaveBeenCalledWith({ mediaType: { equals: "video" } });

    fireEvent.click(screen.getByRole("button", { name: "Tümü" }));
    expect(handleWhereChange).toHaveBeenCalledWith({});
  });

  it("does not throw when handleWhereChange is unavailable", () => {
    mockUseListQuery.mockReturnValue({ handleWhereChange: undefined, query: {} });
    render(<MediaFilterTabs />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Videolar" }))).not.toThrow();
  });
});
