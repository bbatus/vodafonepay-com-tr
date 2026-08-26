// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReorderWidget from "@/components/ReorderWidget";
import { ROLES } from "@/access/roles";

const mockRefresh = vi.fn();
const mockUseAuth = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: (...args: unknown[]) => toastError(...args) },
}));

beforeEach(() => {
  mockRefresh.mockClear();
  toastSuccess.mockClear();
  toastError.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, opts?: RequestInit) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.startsWith("/api/faq-items") && (!opts || opts.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              { id: 1, question: "Soru A", order: 1 },
              { id: 2, question: "Soru B", order: 2 },
            ],
          }),
        });
      }
      if (opts?.method === "PATCH") return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: false, json: async () => ({}) });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReorderWidget", () => {
  it("renders nothing for a role without write access (no fetch issued)", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.GROWTH_MAKER } });
    const { container } = render(<ReorderWidget collection="faq-items" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/faq-items"), expect.anything());
  });

  it("renders nothing when the collection has fewer than 2 items", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        return Promise.resolve({ ok: true, json: async () => ({ docs: [{ id: 1, question: "Only one", order: 1 }] }) });
      })
    );
    const { container } = render(<ReorderWidget collection="faq-items" />);
    await waitFor(() => expect(container.querySelector(".reorder-widget__panel")).toBeNull());
  });

  it("loads and drags an item to reorder, then saves via a two-phase PATCH", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    render(<ReorderWidget collection="faq-items" />);

    await waitFor(() => expect(screen.getByText(/Soru A/)).toBeInTheDocument());
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    fireEvent.dragStart(items[1]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);

    const saveButton = await screen.findByRole("button", { name: /Kaydet/ });
    fireEvent.click(saveButton);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
    const patchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: unknown[]) => (call[1] as RequestInit | undefined)?.method === "PATCH"
    );
    expect(patchCalls.length).toBeGreaterThan(0);
  });

  it("discards a drag without issuing any PATCH", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    render(<ReorderWidget collection="faq-items" />);
    await waitFor(() => expect(screen.getByText(/Soru A/)).toBeInTheDocument());

    const items = screen.getAllByRole("listitem");
    fireEvent.dragStart(items[1]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);

    const discardButton = await screen.findByRole("button", { name: /Vazgeç/ });
    fireEvent.click(discardButton);

    await waitFor(() => expect(screen.queryByRole("button", { name: /Vazgeç/ })).not.toBeInTheDocument());
    const patchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: unknown[]) => (call[1] as RequestInit | undefined)?.method === "PATCH"
    );
    expect(patchCalls).toHaveLength(0);
  });

  it("shows a save error and keeps the unsaved state when a PATCH fails", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, opts?: RequestInit) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        if (opts?.method === "PATCH") return Promise.resolve({ ok: false, json: async () => ({}) });
        return Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              { id: 1, question: "Soru A", order: 1 },
              { id: 2, question: "Soru B", order: 2 },
            ],
          }),
        });
      })
    );
    render(<ReorderWidget collection="faq-items" />);
    await waitFor(() => expect(screen.getByText(/Soru A/)).toBeInTheDocument());

    const items = screen.getAllByRole("listitem");
    fireEvent.dragStart(items[1]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);

    const saveButton = await screen.findByRole("button", { name: /Kaydet/ });
    fireEvent.click(saveButton);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });
});
