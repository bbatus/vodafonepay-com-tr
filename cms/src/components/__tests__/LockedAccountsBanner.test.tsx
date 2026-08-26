// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LockedAccountsBanner from "@/components/LockedAccountsBanner";
import { ROLES } from "@/access/roles";

const mockUseAuth = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LockedAccountsBanner", () => {
  it("renders nothing for a role other than New Vertical Maker, and never fetches", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.GROWTH_CHECKER } });
    const fetchSpy = vi.fn((url: string) =>
      url.includes("/api/translations")
        ? Promise.resolve({ ok: true, json: async () => ({ docs: [] }) })
        : Promise.resolve({ ok: false, json: async () => ({}) })
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { container } = render(<LockedAccountsBanner />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining("/api/users"), expect.anything());
  });

  it("renders nothing when the New Vertical Maker has zero locked accounts", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 0 }) }));
    const { container } = render(<LockedAccountsBanner />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows the count and a link to the sorted list when accounts are locked", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 3 }) }));
    render(<LockedAccountsBanner />);
    await waitFor(() => expect(screen.getByText("3 hesap şu anda kilitli.")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Kilitli hesapları görüntüle →" })).toHaveAttribute(
      "href",
      "/admin/collections/users?sort=-lockUntil"
    );
  });

  it("treats a failed fetch as zero locked accounts, no crash", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { container } = render(<LockedAccountsBanner />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
