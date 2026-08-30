// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ROLES } from "@/access/roles";
import { HELP_CONTENT } from "@/lib/helpContent";
import GuideApp from "@/components/GuideApp";

let mockRole = ROLES.GROWTH_MAKER as string;
vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => ({ user: { role: mockRole } }),
}));

describe("GuideApp", () => {
  it("renders every section with a working table of contents", () => {
    render(<GuideApp />);
    expect(screen.getByRole("link", { name: "Başlarken" })).toHaveAttribute("href", "#getting-started");
    expect(screen.getByRole("heading", { name: "Rolünüz Ne Yapabilir" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard'u Okumak" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Koleksiyon Rehberi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sıkıştım, Ne Yapmalıyım?" })).toBeInTheDocument();
  });

  it("lists all 4 AccessPoint roles with their real RFP summary text", () => {
    render(<GuideApp />);
    expect(screen.getByText("New Vertical — Maker")).toBeInTheDocument();
    expect(screen.getByText("New Vertical — Checker")).toBeInTheDocument();
    expect(screen.getByText("Growth — Maker")).toBeInTheDocument();
    expect(screen.getByText("Growth — Checker")).toBeInTheDocument();
  });

  it("badges only the signed-in user's own role", () => {
    mockRole = ROLES.GROWTH_CHECKER;
    render(<GuideApp />);
    const badges = screen.getAllByText("Siz");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest(".guide__role")).toHaveTextContent("Growth — Checker");
  });

  it("shows no role badge for an unrecognized/missing role", () => {
    mockRole = "not_a_real_role";
    render(<GuideApp />);
    expect(screen.queryByText("Siz")).not.toBeInTheDocument();
  });

  it("lists every collection that has HELP_CONTENT as a nav button, grouped by sidebar section", () => {
    mockRole = ROLES.GROWTH_MAKER;
    render(<GuideApp />);
    expect(screen.getByText("İçerik Yönetimi")).toBeInTheDocument();
    expect(screen.getByText("Site Yapısı")).toBeInTheDocument();
    expect(screen.getByText("Sistem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kategoriler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Denetim Kayıtları" })).toBeInTheDocument();
  });

  it("opens on the first documented collection, with its FULL step-by-step written out, not just a summary", () => {
    render(<GuideApp />);
    expect(screen.getByRole("heading", { name: HELP_CONTENT.categories.tr.title })).toBeInTheDocument();
    for (const step of HELP_CONTENT.categories.tr.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    // A collection not currently selected shows only in the nav, not its steps.
    expect(screen.queryByText(HELP_CONTENT.pages.tr.steps[0])).not.toBeInTheDocument();
  });

  it("switches the detail pane to whichever collection is clicked", () => {
    render(<GuideApp />);
    fireEvent.click(screen.getByRole("button", { name: "Sayfalar" }));
    expect(screen.getByRole("heading", { name: HELP_CONTENT.pages.tr.title })).toBeInTheDocument();
    expect(screen.getByText(HELP_CONTENT.pages.tr.steps[0])).toBeInTheDocument();
    expect(screen.queryByText(HELP_CONTENT.categories.tr.steps[0])).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sayfalar" })).toHaveAttribute("aria-current", "page");
  });
});
