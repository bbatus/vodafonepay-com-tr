// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CampaignsExportButton from "@/components/CampaignsExportButton";

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

function stubCampaignsFetch(docs: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs }) });
    })
  );
}

describe("CampaignsExportButton", () => {
  it("labels status/review/campaign state, flattens body/terms richtext, and resolves related labels", async () => {
    stubCampaignsFetch([
      {
        title: "Yaz Kampanyası",
        slug: "yaz-kampanyasi",
        category: { id: 3, label: "Mobil" },
        _status: "published",
        reviewStatus: "pending",
        campaignStatus: "active",
        featured: true,
        createdBy: { id: 9, email: "maker@vodafone.local" },
        body: { root: { children: [{ text: "Kampanya" }, { text: "gövdesi" }] } },
        terms: { root: { children: [{ text: "Şartlar" }] } },
      },
    ]);
    render(<CampaignsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain("Yaz Kampanyası");
    expect(csv).toContain('"Mobil"');
    expect(csv).toContain('"Yayında"');
    expect(csv).toContain('"İncelemede"');
    expect(csv).toContain('"Aktif"');
    expect(csv).toContain('"Evet"');
    expect(csv).toContain("maker@vodafone.local");
    expect(csv).toContain("Kampanya gövdesi");
    expect(csv).toContain("Şartlar");
  });

  it("falls back to the raw related id and 'Hayır' when a relationship didn't populate", async () => {
    stubCampaignsFetch([
      {
        title: "Kış Kampanyası",
        category: 42,
        _status: "draft",
        reviewStatus: "rejected",
        campaignStatus: "expired",
        featured: false,
        createdBy: null,
      },
    ]);
    render(<CampaignsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain('"42"');
    expect(csv).toContain('"Taslak"');
    expect(csv).toContain('"Reddedildi"');
    expect(csv).toContain('"Süresi doldu"');
    expect(csv).toContain('"Hayır"');
  });
});
