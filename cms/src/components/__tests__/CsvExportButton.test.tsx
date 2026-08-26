// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CsvExportButton } from "@/components/CsvExportButton";

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: (...args: unknown[]) => toastError(...args) },
}));

type Row = { id: string | number; title: string };

const buildTable = (docs: Row[]) => ({
  header: ["ID", "Başlık"],
  rows: docs.map((d) => [String(d.id), d.title]),
});

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs: [{ id: 1, title: "Kampanya A" }] }) });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CsvExportButton", () => {
  it("fetches, downloads, and toasts success on click", async () => {
    render(
      <CsvExportButton<Row>
        collection="campaigns"
        defaultSort="-createdAt"
        filenamePrefix="campaigns"
        translationPrefix="campaignsExport"
        buildTable={buildTable}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("shows an error toast when the export fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      })
    );
    render(
      <CsvExportButton<Row>
        collection="campaigns"
        defaultSort="-createdAt"
        filenamePrefix="campaigns"
        translationPrefix="campaignsExport"
        buildTable={buildTable}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it("disables the button while exporting", async () => {
    render(
      <CsvExportButton<Row>
        collection="campaigns"
        defaultSort="-createdAt"
        filenamePrefix="campaigns"
        translationPrefix="campaignsExport"
        buildTable={buildTable}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });
});
