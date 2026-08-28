// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeesAndLimitsApp from "@/components/FeesAndLimitsApp";

// Flipped per-test to cover the Growth Checker case (`create: false`), whose
// create buttons must not render at all — see CreateButton in the component.
let canCreate = true;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => ({
    permissions: { collections: { "fee-rows": { create: canCreate }, "limit-tables": { create: canCreate } } },
  }),
  useDocumentDrawer: () => [
    () => null,
    ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className}>
        {children}
      </button>
    ),
  ],
}));

vi.mock("@/components/ReorderWidget", () => ({
  default: ({ collection }: { collection: string }) => <div data-testid={`reorder-${collection}`} />,
}));

beforeEach(() => {
  canCreate = true;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/fee-rows")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ docs: [{ id: "f1", label: "İşlem Ücreti", value: "%1", order: 1, _status: "published" }] }),
        });
      }
      if (url.includes("/api/limit-tables")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ docs: [{ id: "l1", title: "Günlük Limit", order: 1, rows: [{ category: "a" }] }] }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FeesAndLimitsApp", () => {
  it("loads and shows fee rows on the default tab", async () => {
    render(<FeesAndLimitsApp />);
    await waitFor(() => expect(screen.getByText("İşlem Ücreti")).toBeInTheDocument());
    expect(screen.getByTestId("reorder-fee-rows")).toBeInTheDocument();
  });

  it("switches to the limit-tables tab and shows its rows", async () => {
    render(<FeesAndLimitsApp />);
    await waitFor(() => expect(screen.getByText("İşlem Ücreti")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Limit Tabloları", pressed: false }));

    await waitFor(() => expect(screen.getByText("Günlük Limit")).toBeInTheDocument());
    expect(screen.getByTestId("reorder-limit-tables")).toBeInTheDocument();
  });

  it("shows an error message when the fee-rows fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );
    render(<FeesAndLimitsApp />);
    await waitFor(() => expect(screen.getByText("Bu koleksiyonu görüntüleme yetkiniz yok.")).toBeInTheDocument());
  });

  it("shows the create buttons to a role that has create permission", async () => {
    render(<FeesAndLimitsApp />);
    await waitFor(() => expect(screen.getByText("İşlem Ücreti")).toBeInTheDocument());
    expect(screen.getByText("Yeni Ücret Satırı")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limit Tabloları", pressed: false }));
    await waitFor(() => expect(screen.getByText("Yeni Limit Tablosu")).toBeInTheDocument());
  });

  it("hides the create buttons from a role without create permission (Growth Checker)", async () => {
    canCreate = false;
    render(<FeesAndLimitsApp />);
    await waitFor(() => expect(screen.getByText("İşlem Ücreti")).toBeInTheDocument());
    expect(screen.queryByText("Yeni Ücret Satırı")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limit Tabloları", pressed: false }));
    await waitFor(() => expect(screen.getByText("Günlük Limit")).toBeInTheDocument());
    expect(screen.queryByText("Yeni Limit Tablosu")).not.toBeInTheDocument();
  });
});
