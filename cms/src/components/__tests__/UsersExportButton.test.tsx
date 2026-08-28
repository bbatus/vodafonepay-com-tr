// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UsersExportButton from "@/components/UsersExportButton";
import { ROLES } from "@/access/roles";

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
  // downloadCsv prepends a UTF-8 BOM.
  return text.replace(/^﻿/, "");
}

function stubUsersFetch(docs: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs }) });
    })
  );
}

describe("UsersExportButton", () => {
  it("formats the role, locale, and active lock state into CSV columns", async () => {
    stubUsersFetch([
      {
        email: "active@vodafone.local",
        role: ROLES.GROWTH_MAKER,
        preferredLocale: "en",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        lastLoginAt: "2026-08-01T00:00:00.000Z",
        lastLoginIp: "10.0.0.5",
        lockUntil: null,
      },
    ]);
    render(<UsersExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain('"E-posta";"Rol";"Dil Tercihi";"Hesap Durumu"');
    expect(csv).toContain("active@vodafone.local");
    expect(csv).toContain("Growth — Maker (New Vertical ile aynı kapsam, yayınlayamaz)");
    expect(csv).toContain('"English"');
    expect(csv).toContain('"Aktif"');
    expect(csv).toContain("10.0.0.5");
  });

  it("formats a currently-locked account as 'Kilitli' with the lock-until date", async () => {
    stubUsersFetch([
      {
        email: "locked@vodafone.local",
        role: ROLES.NEW_VERTICAL_MAKER,
        preferredLocale: "tr",
        lockUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    ]);
    render(<UsersExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain("Kilitli (");
    expect(csv).toContain("Türkçe");
  });
});
