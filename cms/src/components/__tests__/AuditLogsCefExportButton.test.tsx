// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuditLogsCefExportButton from "@/components/AuditLogsCefExportButton";

const toastSuccess = vi.fn();
const toastError = vi.fn();
let capturedBlob: Blob | null = null;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: (...args: unknown[]) => toastError(...args) },
}));

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  capturedBlob = null;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    }),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubAuditFetch(docs: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs }) });
    })
  );
}

describe("AuditLogsCefExportButton", () => {
  it("drops 'id' and maps the audit-log fields straight into CEF events", async () => {
    stubAuditFetch([
      {
        id: 123,
        createdAt: "2026-08-01T12:00:00.000Z",
        userEmail: "maker@vodafone.local",
        userRole: "growth_maker",
        action: "unlock",
        collectionSlug: "users",
        documentId: "u-1",
        summary: "Kilit kaldırıldı",
        ip: "10.2.2.2",
        userAgent: "Safari",
      },
    ]);
    render(<AuditLogsCefExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const cef = await capturedBlob!.text();
    expect(cef).toContain("CEF:0|VodafonePay|CMS|1.0|unlock|Account Unlocked|4|");
    expect(cef).toContain("suser=maker@vodafone.local");
    expect(cef).toContain("src=10.2.2.2");
    expect(cef).toContain("cs2Label=Collection cs2=users");
    expect(cef).toContain("cs3Label=DocumentId cs3=u-1");
    expect(cef).toContain("msg=Kilit kaldırıldı");
    expect(cef).not.toContain("id=123");
  });

  it("shows an error toast when the export fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      })
    );
    render(<AuditLogsCefExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
