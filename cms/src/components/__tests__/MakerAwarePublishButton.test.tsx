// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MakerAwarePublishButton from "@/components/MakerAwarePublishButton";
import { ROLES } from "@/access/roles";

const mockUseAuth = vi.fn();

/**
 * Both of Payload's real buttons are stubbed: what this component decides is
 * *which* controls exist for a given role, and rendering Payload's own button
 * internals here would only test Payload.
 */
vi.mock("@payloadcms/ui", () => ({
  useAuth: () => mockUseAuth(),
  useTranslation: () => ({ i18n: { language: "tr" } }),
  PublishButton: () => <button type="button">Değişiklikleri yayınla</button>,
  UnpublishButton: ({ label }: { label?: string }) => <button type="button">{label}</button>,
}));

beforeEach(() => {
  // useIsActiveCheckerDelegate queries for a delegation row; none by default.
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 0 }) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MakerAwarePublishButton", () => {
  it("gives a Growth Maker the awaiting notice and neither publish nor unpublish", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: ROLES.GROWTH_MAKER } });

    render(<MakerAwarePublishButton />);

    expect(await screen.findByText("Onay bekliyor (Checker yayınlar)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Değişiklikleri yayınla" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yayından Kaldır" })).not.toBeInTheDocument();
  });

  /**
   * The 29.08 gap: the Checker could publish and then never take it back down,
   * because Payload only offers Unpublish inside a ⋮ menu that needs
   * create-or-delete permission — neither of which a Checker has by design.
   */
  it("gives a Growth Checker both publish and unpublish", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: ROLES.GROWTH_CHECKER } });

    render(<MakerAwarePublishButton />);

    expect(await screen.findByRole("button", { name: "Değişiklikleri yayınla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yayından Kaldır" })).toBeInTheDocument();
  });

  it("gives a New Vertical Maker both as well", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 3, role: ROLES.NEW_VERTICAL_MAKER } });

    render(<MakerAwarePublishButton />);

    expect(await screen.findByRole("button", { name: "Değişiklikleri yayınla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yayından Kaldır" })).toBeInTheDocument();
  });

  /**
   * `denyRolePublish` lets an active checker delegate publish server-side, so
   * the UI must not take that right away from them either.
   */
  it("gives an active checker delegate the real controls, not the notice", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 4, role: ROLES.GROWTH_MAKER } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 1 }) }));

    render(<MakerAwarePublishButton />);

    expect(await screen.findByRole("button", { name: "Değişiklikleri yayınla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yayından Kaldır" })).toBeInTheDocument();
    expect(screen.queryByText("Onay bekliyor (Checker yayınlar)")).not.toBeInTheDocument();
  });
});
