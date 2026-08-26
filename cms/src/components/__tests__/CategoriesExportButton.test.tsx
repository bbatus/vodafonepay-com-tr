// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CategoriesExportButton from "@/components/CategoriesExportButton";

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

function stubCategoriesFetch(docs: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs }) });
    })
  );
}

describe("CategoriesExportButton", () => {
  it("labels the scope and formats order/dates", async () => {
    stubCategoriesFetch([
      {
        label: "Anında Bakiye",
        scope: "faq",
        slug: "aninda-bakiye",
        order: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    render(<CategoriesExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain("Anında Bakiye");
    expect(csv).toContain('"Sıkça Sorulan Sorular"');
    expect(csv).toContain('"2"');
  });

  it("leaves order/dates blank when absent and passes through an unrecognized scope as-is", async () => {
    stubCategoriesFetch([{ label: "Diğer", scope: "unknown-scope", slug: "diger" }]);
    render(<CategoriesExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain('"unknown-scope"');
    // order/created/updated columns render as empty quoted cells: ;"";""
    expect(csv).toMatch(/"diger";"";"";""/);
  });
});
