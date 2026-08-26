// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GroupedNavLink from "@/components/GroupedNavLink";
import { ROLES } from "@/access/roles";

const mockUseAuth = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GroupedNavLink", () => {
  it("renders nothing for an nvMakerOnly link when the user isn't a New Vertical Maker", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.GROWTH_MAKER } });
    const { container } = render(
      <GroupedNavLink href="/admin/access-matrix" labelKey="nav.accessMatrix" groupNames={["Sistem"]} nvMakerOnly />
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders a fallback block when no matching nav group exists in the DOM", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    render(<GroupedNavLink href="/admin/content" labelKey="nav.allContent" groupNames={["Sistem", "System"]} />);
    await waitFor(() => expect(screen.getByRole("link")).toBeInTheDocument());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/content");
  });

  it("portals the link into a matching nav group's content when one exists", async () => {
    document.body.innerHTML = `
      <div class="nav-group">
        <button class="nav-group__toggle">Sistem</button>
        <div class="nav-group__content"></div>
      </div>
    `;
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    render(<GroupedNavLink href="/admin/content" labelKey="nav.allContent" groupNames={["Sistem", "System"]} />);
    await waitFor(() => {
      const group = document.querySelector(".nav-group__content")!;
      expect(group.querySelector("a")).not.toBeNull();
    });
  });

  it("is not gated by role when nvMakerOnly is false, regardless of role", async () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.GROWTH_CHECKER } });
    render(<GroupedNavLink href="/admin/fees-and-limits" labelKey="nav.feesAndLimits" groupNames={["Sistem"]} />);
    await waitFor(() => expect(screen.getByRole("link")).toBeInTheDocument());
  });
});
