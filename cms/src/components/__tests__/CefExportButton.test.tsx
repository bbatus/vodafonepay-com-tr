// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CefExportButton } from "@/components/CefExportButton";
import type { CefEvent } from "@/lib/cef";

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: (...args: unknown[]) => toastError(...args) },
}));

type Row = { id: string | number; action: string };

const buildEvents = (docs: Row[]): CefEvent[] => docs.map((d) => ({ action: d.action }));

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs: [{ id: 1, action: "login" }] }) });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CefExportButton", () => {
  it("fetches, downloads, and toasts success on click", async () => {
    render(
      <CefExportButton<Row>
        collection="audit-logs"
        defaultSort="-createdAt"
        filenamePrefix="audit-logs"
        translationPrefix="auditLogsCefExport"
        buildEvents={buildEvents}
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
      <CefExportButton<Row>
        collection="audit-logs"
        defaultSort="-createdAt"
        filenamePrefix="audit-logs"
        translationPrefix="auditLogsCefExport"
        buildEvents={buildEvents}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
