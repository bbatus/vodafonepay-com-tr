// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ContentManagementApp from "@/components/ContentManagementApp";

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
}));

function jsonRes(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body });
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return jsonRes({ docs: [] });
      if (url.startsWith("/api/campaigns")) {
        if (url.includes("limit=0")) return jsonRes({ totalDocs: 5 });
        return jsonRes({
          docs: [{ id: "c1", title: "Yaz Kampanyası", category: { label: "Dijital" }, _status: "published", reviewStatus: null, featured: true, endDate: "2026-09-01", updatedAt: "2026-01-05T00:00:00.000Z" }],
          totalPages: 1,
          totalDocs: 1,
        });
      }
      // every other collection in the summary
      if (url.includes("limit=0")) return jsonRes({ totalDocs: 2 });
      return jsonRes({ docs: [], totalPages: 1, totalDocs: 0 });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContentManagementApp", () => {
  it("renders the summary table with a real count once collections load", async () => {
    render(<ContentManagementApp />);
    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });
    const campaignsRow = screen.getByRole("link", { name: "Kampanyalar" }).closest("tr")!;
    expect(within(campaignsRow).getAllByText("5")).toHaveLength(2);
  });

  it("marks a collection the current role can't read as inaccessible in the summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return jsonRes({ docs: [] });
        if (url.startsWith("/api/categories") && url.includes("limit=0")) return jsonRes({}, false);
        if (url.startsWith("/api/campaigns")) {
          if (url.includes("limit=0")) return jsonRes({ totalDocs: 5 });
          return jsonRes({ docs: [], totalPages: 1, totalDocs: 0 });
        }
        if (url.includes("limit=0")) return jsonRes({ totalDocs: 2 });
        return jsonRes({ docs: [], totalPages: 1, totalDocs: 0 });
      })
    );
    render(<ContentManagementApp />);
    await waitFor(() => {
      const row = screen.getByRole("link", { name: "Kategoriler" }).closest("tr")!;
      expect(within(row).getByText("Bu koleksiyonu görüntüleme yetkiniz yok.")).toBeInTheDocument();
    });
  });

  it("shows the detail table for the default (campaigns) tab, linking each row to its document", async () => {
    render(<ContentManagementApp />);
    await waitFor(() => expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument());
    const link = screen.getByRole("link", { name: "Yaz Kampanyası" });
    expect(link).toHaveAttribute("href", "/admin/collections/campaigns/c1");
  });

  it("re-fetches the detail list when switching tabs", async () => {
    render(<ContentManagementApp />);
    await waitFor(() => expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Kategoriler" }));

    await waitFor(() => expect(screen.getByText("Kayıt bulunamadı.")).toBeInTheDocument());
  });

  it("shows the read-only site-routes table with client-side search filtering", async () => {
    render(<ContentManagementApp />);
    await waitFor(() => expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Site Sayfaları|Site Pages/i }));
    await waitFor(() => expect(screen.getByText("/")).toBeInTheDocument());

    const search = screen.getByPlaceholderText(/Ara|Search/i);
    fireEvent.change(search, { target: { value: "___no_such_route___" } });
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });

  it("surfaces a real server-error message (not the generic no-access copy) on a 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return jsonRes({ docs: [] });
        if (url.startsWith("/api/campaigns") && !url.includes("limit=0")) return jsonRes({}, false);
        if (url.includes("limit=0")) return jsonRes({ totalDocs: 0 });
        return jsonRes({ docs: [], totalPages: 1, totalDocs: 0 });
      })
    );
    render(<ContentManagementApp />);
    await waitFor(() =>
      expect(screen.getByText("Sunucuda beklenmeyen bir hata oluştu. Sorun devam ederse yöneticinize bildirin.")).toBeInTheDocument()
    );
  });
});
