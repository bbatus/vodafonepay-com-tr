// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("renders a first-step summary for every collection that has HELP_CONTENT, grouped by sidebar section", () => {
    mockRole = ROLES.GROWTH_MAKER;
    render(<GuideApp />);
    expect(screen.getByText("İçerik Yönetimi")).toBeInTheDocument();
    expect(screen.getByText("Site Yapısı")).toBeInTheDocument();
    expect(screen.getByText("Sistem")).toBeInTheDocument();
    expect(screen.getByText("Kategoriler")).toBeInTheDocument();
    expect(screen.getByText(HELP_CONTENT.categories.tr.steps[0])).toBeInTheDocument();
    expect(screen.getByText("Denetim Kayıtları")).toBeInTheDocument();
  });
});
