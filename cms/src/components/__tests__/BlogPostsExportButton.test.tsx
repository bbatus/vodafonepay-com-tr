// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BlogPostsExportButton from "@/components/BlogPostsExportButton";

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

function stubBlogFetch(docs: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/audit/export")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({ docs }) });
    })
  );
}

describe("BlogPostsExportButton", () => {
  it("labels postStatus/_status, resolves the related category, and flattens body richtext", async () => {
    stubBlogFetch([
      {
        title: "İlk Yazı",
        slug: "ilk-yazi",
        category: { id: 4, label: "Duyurular" },
        postStatus: "active",
        _status: "published",
        body: { root: { children: [{ text: "Merhaba" }, { text: "dünya" }] } },
      },
    ]);
    render(<BlogPostsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain("İlk Yazı");
    expect(csv).toContain('"Duyurular"');
    expect(csv).toContain('"Aktif"');
    expect(csv).toContain('"Yayında"');
    expect(csv).toContain("Merhaba dünya");
  });

  it("labels an archived draft post and falls back to the raw related id", async () => {
    stubBlogFetch([
      { title: "Arşiv Yazısı", category: 7, postStatus: "archived", _status: "draft" },
    ]);
    render(<BlogPostsExportButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const csv = await csvText();
    expect(csv).toContain('"7"');
    expect(csv).toContain('"Arşivlendi"');
    expect(csv).toContain('"Taslak"');
  });
});
