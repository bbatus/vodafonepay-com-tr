// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Payload } from "payload";
import DashboardWidgets from "@/components/DashboardWidgets";
import { ROLES } from "@/access/roles";

vi.mock("@/access/roles", async () => {
  const actual = await vi.importActual<typeof import("@/access/roles")>("@/access/roles");
  return { ...actual, hasActiveCheckerDelegate: vi.fn().mockResolvedValue(false) };
});

vi.mock("@/lib/campaignApprovals", () => ({
  loadPendingCampaigns: vi.fn().mockResolvedValue([]),
  loadOwnDrafts: vi.fn().mockResolvedValue([]),
}));

const { loadPendingCampaigns, loadOwnDrafts } = await import("@/lib/campaignApprovals");
const { hasActiveCheckerDelegate } = await import("@/access/roles");

function fakePayload(overrides: Partial<Payload> = {}): Payload {
  return {
    find: vi.fn().mockResolvedValue({ docs: [] }),
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    ...overrides,
  } as unknown as Payload;
}

const i18n = (language: "tr" | "en" = "tr") => ({ language }) as never;

describe("DashboardWidgets", () => {
  it("shows the recent-logins widget for a Growth Maker with no drafts", async () => {
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "1", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Son Giriş Yapanlar")).toBeInTheDocument();
    expect(screen.getByText("Henüz giriş kaydı yok.")).toBeInTheDocument();
  });

  it("renders recent login rows with role label, timestamp and IP", async () => {
    const payload = fakePayload({
      find: vi.fn().mockResolvedValue({
        docs: [{ userEmail: "a@vodafone.local", userRole: ROLES.GROWTH_MAKER, createdAt: "2026-01-01T10:00:00.000Z", ip: "10.0.0.1" }],
      }),
    });
    const el = await DashboardWidgets({ payload, user: { id: "1", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("a@vodafone.local")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument();
  });

  it("shows the straight-to-review queue for a Checker role instead of stat cards", async () => {
    vi.mocked(loadPendingCampaigns).mockResolvedValueOnce([{ id: "c1", title: "Yaz Kampanyası", createdByEmail: "maker@vodafone.local" }]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "2", role: ROLES.GROWTH_CHECKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument();
    expect(loadPendingCampaigns).toHaveBeenCalledWith(payload);
  });

  it("grants a checker-style review queue to an active checker delegate, even with a maker role", async () => {
    vi.mocked(hasActiveCheckerDelegate).mockResolvedValueOnce(true);
    vi.mocked(loadPendingCampaigns).mockResolvedValueOnce([{ id: "c2", title: "Delegated Review" }]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "3", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Delegated Review")).toBeInTheDocument();
  });

  it("shows a Maker's own drafts widget, distinguishing pending vs rejected", async () => {
    vi.mocked(loadOwnDrafts).mockResolvedValueOnce([
      { id: "d1", title: "Pending Draft", reviewStatus: "pending" },
      { id: "d2", title: "Rejected Draft", reviewStatus: "rejected" },
    ]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "4", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Pending Draft")).toBeInTheDocument();
    expect(screen.getByText("Rejected Draft")).toBeInTheDocument();
    expect(screen.getByText("İncelemede")).toBeInTheDocument();
    expect(screen.getByText("Reddedildi")).toBeInTheDocument();
  });

  it("shows the pending-review banner when a Maker's collection stats include drafts", async () => {
    const payload = fakePayload({
      count: vi.fn().mockResolvedValue({ totalDocs: 2 }),
    });
    const el = await DashboardWidgets({ payload, user: { id: "5", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Onay Bekleyen Taslaklar")).toBeInTheDocument();
  });

  it("uses the New Vertical collection set (not Growth's) for a New Vertical Maker", async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 });
    const payload = fakePayload({ count });
    await DashboardWidgets({ payload, user: { id: "6", role: ROLES.NEW_VERTICAL_MAKER }, i18n: i18n() });
    const calledSlugs = count.mock.calls.map((c: unknown[]) => (c[0] as { collection: string }).collection);
    expect(calledSlugs).toContain("faq-items");
  });
});
