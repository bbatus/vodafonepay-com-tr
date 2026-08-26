// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MediaUsageField from "@/components/MediaUsageField";

const mockUseDocumentInfo = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useDocumentInfo: () => mockUseDocumentInfo(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  mockUseDocumentInfo.mockReturnValue({ id: undefined });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MediaUsageField", () => {
  it("renders nothing when there is no document id yet (new/unsaved media)", () => {
    const { container } = render(<MediaUsageField />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the loading state, then the empty message when nothing references this media", async () => {
    mockUseDocumentInfo.mockReturnValue({ id: "9" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
    render(<MediaUsageField />);
    expect(screen.getByText("Aranıyor…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Herhangi bir içerikte kullanılmıyor.")).toBeInTheDocument());
  });

  it("lists usages found across collections, deduped, with a link to each document", async () => {
    mockUseDocumentInfo.mockReturnValue({ id: "9" });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/campaigns")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ docs: [{ id: 1, title: "Yaz Kampanyası" }] }),
          });
        }
        if (url.includes("/api/legal-pages")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ docs: [{ id: 2, title: "Gizlilik" }] }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      })
    );
    render(<MediaUsageField />);
    await waitFor(() => expect(screen.getByText(/Yaz Kampanyası/)).toBeInTheDocument());
    expect(screen.getByText(/Gizlilik/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yaz Kampanyası/ })).toHaveAttribute(
      "href",
      "/admin/collections/campaigns/1"
    );
    expect(screen.getByText("Kullanıldığı Yerler")).toBeInTheDocument();
    expect(
      screen.getByText("Kullanımda olduğu için bu medya silinemez — önce yukarıdaki kayıtlardan kaldırın.")
    ).toBeInTheDocument();
  });

  it("treats a failed source fetch as no hits from that source, no crash", async () => {
    mockUseDocumentInfo.mockReturnValue({ id: "9" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<MediaUsageField />);
    await waitFor(() => expect(screen.getByText("Herhangi bir içerikte kullanılmıyor.")).toBeInTheDocument());
  });
});
