// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LoginHistoryField from "@/components/LoginHistoryField";

const mockUseAuth = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: undefined });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LoginHistoryField", () => {
  it("does not fetch login history when there is no logged-in user email yet", () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) });
    vi.stubGlobal("fetch", fetchSpy);
    render(<LoginHistoryField />);
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining("/api/audit-logs"), expect.anything());
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
  });

  it("shows the empty message when the user has no login history", async () => {
    mockUseAuth.mockReturnValue({ user: { email: "a@vodafone.local" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
    render(<LoginHistoryField />);
    await waitFor(() => expect(screen.getByText("Henüz giriş kaydı yok.")).toBeInTheDocument());
  });

  it("renders a table of login entries with date, ip, and user agent", async () => {
    mockUseAuth.mockReturnValue({ user: { email: "a@vodafone.local" } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [{ createdAt: "2026-08-20T10:00:00.000Z", ip: "10.0.0.1", userAgent: "Chrome/1.0" }],
        }),
      })
    );
    render(<LoginHistoryField />);
    await waitFor(() => expect(screen.getByText("10.0.0.1")).toBeInTheDocument());
    expect(screen.getByText("Chrome/1.0")).toBeInTheDocument();
    expect(screen.getByText("Son Girişler")).toBeInTheDocument();
    expect(screen.getByText("Tarih")).toBeInTheDocument();
  });

  it("shows an em-dash for missing ip/user agent, and treats a failed fetch as empty", async () => {
    mockUseAuth.mockReturnValue({ user: { email: "a@vodafone.local" } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [{ createdAt: "2026-08-20T10:00:00.000Z" }] }) })
    );
    const { rerender } = render(<LoginHistoryField />);
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0));

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    mockUseAuth.mockReturnValue({ user: { email: "b@vodafone.local" } });
    rerender(<LoginHistoryField />);
    await waitFor(() => expect(screen.getByText("Henüz giriş kaydı yok.")).toBeInTheDocument());
  });
});
