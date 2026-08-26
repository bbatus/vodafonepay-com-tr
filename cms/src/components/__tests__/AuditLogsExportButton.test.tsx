// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuditLogsExportButton from "@/components/AuditLogsExportButton";

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

async function csvText(): Promise<string> {
  const text = await capturedBlob!.text();
  return text.replace(/^﻿/, "");
}

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

describe("AuditLogsExportButton", () => {
  it("translates a known action into a human label", async () => {
    stubAuditFetch([
      {
        createdAt: "2026-08-01T12:00:00.000Z",
        userEmail: "checker@vodafone.local",
        userRole: "new_vertical_checker",
        action: "publish",
        collectionSlug: "campaigns",
        summary: "Yayınlandı",
        ip: "10.1.1.1",
        userAgent: "Firefox",
      },
    ]);
    render(<AuditLogsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain("checker@vodafone.local");
    expect(csv).toContain('"Yayınlandı"');
    expect(csv).toContain("campaigns");
    expect(csv).toContain("10.1.1.1");
  });

  it("falls back to the raw action string when it isn't in the known label map", async () => {
    stubAuditFetch([{ createdAt: "2026-08-01T12:00:00.000Z", action: "custom_thing" }]);
    render(<AuditLogsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain('"custom_thing"');
  });
});
