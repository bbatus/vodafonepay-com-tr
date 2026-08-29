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

vi.mock("@/lib/approvalQueue", () => ({
  loadPendingApprovals: vi.fn().mockResolvedValue([]),
  loadOwnPendingDrafts: vi.fn().mockResolvedValue([]),
}));

const { loadPendingApprovals, loadOwnPendingDrafts } = await import("@/lib/approvalQueue");
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

  /**
   * The queue used to be Campaigns-only, so anything else a Maker submitted
   * never reached a Checker's dashboard. It must now list every collection in
   * the role's scope, and say which collection each row came from.
   */
  it("shows a Checker every collection's pending work, labelled by collection", async () => {
    vi.mocked(loadPendingApprovals).mockResolvedValueOnce([
      { id: "c1", collectionSlug: "campaigns", collectionLabel: "Kampanyalar", title: "Yaz Kampanyası", createdByEmail: "maker@vodafone.local", href: "/admin/collections/campaigns/c1" },
      { id: "p9", collectionSlug: "pages", collectionLabel: "Sayfalar", title: "Ulaşım Ödemeleri", href: "/admin/collections/pages/p9" },
      { id: "f3", collectionSlug: "fee-rows", collectionLabel: "Ücret Tablosu", title: "Ulaşım Kartı Bakiye İadesi", href: "/admin/fees-and-limits" },
    ]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "2", role: ROLES.GROWTH_CHECKER }, i18n: i18n() });
    render(el);

    expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument();
    expect(screen.getByText("Ulaşım Ödemeleri")).toBeInTheDocument();
    expect(screen.getByText("Sayfalar")).toBeInTheDocument();
    expect(screen.getByText("Ücret Tablosu")).toBeInTheDocument();
    // The queue is asked for the role's whole collection scope, not one slug.
    const [, slugs] = vi.mocked(loadPendingApprovals).mock.calls.at(-1)!;
    expect(slugs.length).toBeGreaterThan(1);
    expect(slugs).toContain("pages");
  });

  /** fee-rows is admin.hidden — its collection route 404s, so the row must not link there. */
  it("links a hidden collection's row to the screen that can actually edit it", async () => {
    vi.mocked(loadPendingApprovals).mockResolvedValueOnce([
      { id: "f3", collectionSlug: "fee-rows", collectionLabel: "Ücret Tablosu", title: "Ücret satırı", href: "/admin/fees-and-limits" },
    ]);
    const payload = fakePayload();
    render(await DashboardWidgets({ payload, user: { id: "2", role: ROLES.GROWTH_CHECKER }, i18n: i18n() }));
    expect(screen.getByRole("link", { name: /İncele/ })).toHaveAttribute("href", "/admin/fees-and-limits");
  });

  it("grants a checker-style review queue to an active checker delegate, even with a maker role", async () => {
    vi.mocked(hasActiveCheckerDelegate).mockResolvedValueOnce(true);
    vi.mocked(loadPendingApprovals).mockResolvedValueOnce([
      { id: "c2", collectionSlug: "campaigns", collectionLabel: "Kampanyalar", title: "Delegated Review", href: "/admin/collections/campaigns/c2" },
    ]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "3", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Delegated Review")).toBeInTheDocument();
  });

  it("shows a Maker their own submissions from every collection, pending vs rejected", async () => {
    vi.mocked(loadOwnPendingDrafts).mockResolvedValueOnce([
      { id: "d1", collectionSlug: "campaigns", collectionLabel: "Kampanyalar", title: "Pending Draft", reviewStatus: "pending", href: "/admin/collections/campaigns/d1" },
      { id: "d2", collectionSlug: "campaigns", collectionLabel: "Kampanyalar", title: "Rejected Draft", reviewStatus: "rejected", href: "/admin/collections/campaigns/d2" },
      // No reviewStatus: every collection other than Campaigns. A draft there
      // is simply waiting, and must still be listed.
      { id: "q7", collectionSlug: "faq-items", collectionLabel: "Sık Sorulanlar", title: "Ulaşım kartı sorusu", href: "/admin/collections/faq-items/q7" },
    ]);
    const payload = fakePayload();
    const el = await DashboardWidgets({ payload, user: { id: "4", role: ROLES.GROWTH_MAKER }, i18n: i18n() });
    render(el);
    expect(screen.getByText("Pending Draft")).toBeInTheDocument();
    expect(screen.getByText("Rejected Draft")).toBeInTheDocument();
    expect(screen.getByText("Ulaşım kartı sorusu")).toBeInTheDocument();
    expect(screen.getByText("Sık Sorulanlar")).toBeInTheDocument();
    expect(screen.getByText("Reddedildi")).toBeInTheDocument();
    // Scoped to this Maker, across their whole collection scope.
    const [, userId, slugs] = vi.mocked(loadOwnPendingDrafts).mock.calls.at(-1)!;
    expect(userId).toBe("4");
    expect(slugs).toContain("faq-items");
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
