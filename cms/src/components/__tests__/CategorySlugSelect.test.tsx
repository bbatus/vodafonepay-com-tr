// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CategorySlugSelect from "@/components/CategorySlugSelect";

const mockUseField = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useField: () => mockUseField(),
}));

function stubFetch(docs: { slug?: string; label?: string }[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs }) })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategorySlugSelect", () => {
  beforeEach(() => {
    mockUseField.mockReturnValue({ value: "", setValue: vi.fn() });
  });

  it("scopes the categories lookup to the block's own flow", async () => {
    stubFetch([]);
    render(<CategorySlugSelect path="layout.0.category" scope="campaign" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("where[scope][equals]=campaign");
  });

  it("lists the fetched categories as selectable options, slug shown alongside the label", async () => {
    stubFetch([
      { slug: "kart", label: "Kart" },
      { slug: "aninda-bakiye", label: "Anında Bakiye" },
    ]);
    render(<CategorySlugSelect path="layout.0.category" scope="campaign" />);
    await screen.findByText("Kart (kart)");
    expect(screen.getByText("Anında Bakiye (aninda-bakiye)")).toBeInTheDocument();
    // Always offers the "all" escape hatch, matching the block's own "empty = everything" rule.
    expect(screen.getByText("— Tümü —")).toBeInTheDocument();
  });

  it("writes the picked slug back through the bound field, not the label", async () => {
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: "", setValue });
    stubFetch([{ slug: "kampanyalar", label: "Kampanyalar" }]);
    render(<CategorySlugSelect path="layout.0.category" scope="faq" />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "kampanyalar" } });
    expect(setValue).toHaveBeenCalledWith("kampanyalar");
  });

  it("picking the 'all' option clears the field rather than storing an empty string", async () => {
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: "kart", setValue });
    stubFetch([{ slug: "kart", label: "Kart" }]);
    render(<CategorySlugSelect path="layout.0.category" scope="campaign" />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "" } });
    expect(setValue).toHaveBeenCalledWith(null);
  });

  it("degrades to an empty, still-usable list rather than looking like 'no categories exist' on a failed fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(<CategorySlugSelect path="layout.0.category" scope="blog" />);
    const select = await screen.findByRole("combobox");
    expect(select).not.toBeDisabled();
    expect(screen.getByText("— Tümü —")).toBeInTheDocument();
  });

  it("shows a real category's own current value as selected, not just the slug it was typed as before", async () => {
    mockUseField.mockReturnValue({ value: "odeme", setValue: vi.fn() });
    stubFetch([
      { slug: "genel", label: "Genel" },
      { slug: "odeme", label: "Ödeme" },
    ]);
    render(<CategorySlugSelect path="layout.0.category" scope="faq" />);
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe("odeme"));
  });
});
