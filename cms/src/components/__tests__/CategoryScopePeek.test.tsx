// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CategoryScopePeek from "@/components/CategoryScopePeek";

const mockUseDocumentInfo = vi.fn();
let currentScope: string | undefined;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useDocumentInfo: () => mockUseDocumentInfo(),
  useFormFields: (selector: (fields: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ scope: { value: currentScope } }]),
}));

beforeEach(() => {
  mockUseDocumentInfo.mockReturnValue({ id: undefined });
  currentScope = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategoryScopePeek", () => {
  it("renders nothing when no scope is selected yet", () => {
    const { container } = render(<CategoryScopePeek />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty-flow message when the scope has no other categories", async () => {
    currentScope = "faq";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
    render(<CategoryScopePeek />);
    await waitFor(() =>
      expect(screen.getByText("Bu akışta henüz başka kategori yok — ilkini siz oluşturuyorsunuz.")).toBeInTheDocument()
    );
  });

  it("lists existing categories in the scope, excluding the document being edited", async () => {
    currentScope = "faq";
    mockUseDocumentInfo.mockReturnValue({ id: "5" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            { id: 5, label: "Kendisi", slug: "kendisi" },
            { id: 6, label: "Anında Bakiye", slug: "aninda-bakiye" },
          ],
        }),
      })
    );
    render(<CategoryScopePeek />);
    await waitFor(() => expect(screen.getByText("Anında Bakiye")).toBeInTheDocument());
    expect(screen.queryByText("Kendisi")).not.toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", async () => {
    currentScope = "faq";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    render(<CategoryScopePeek />);
    await waitFor(() => expect(screen.getByText("Mevcut kategoriler yüklenemedi.")).toBeInTheDocument());
  });
});
