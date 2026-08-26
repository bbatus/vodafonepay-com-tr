// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpButton from "@/components/HelpButton";

const mockUseTranslation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => mockUseTranslation(),
  useAuth: () => mockUseAuth(),
}));

function setLocale(language: "tr" | "en") {
  mockUseTranslation.mockReturnValue({ i18n: { language } });
}

describe("HelpButton", () => {
  it("renders nothing for a collection with no help entry and no role", () => {
    setLocale("tr");
    mockUseAuth.mockReturnValue({ user: undefined });
    const { container } = render(<HelpButton collection="__no_such_collection__" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the '?' toggle for a documented collection, panel closed by default", () => {
    setLocale("tr");
    mockUseAuth.mockReturnValue({ user: { role: "GROWTH_MAKER" } });
    render(<HelpButton collection="users" />);
    expect(screen.getByRole("button", { name: "?" })).toBeInTheDocument();
    expect(screen.queryByText("Kullanıcılar")).not.toBeInTheDocument();
  });

  it("opens the panel and shows Turkish help content on click", () => {
    setLocale("tr");
    mockUseAuth.mockReturnValue({ user: { role: "GROWTH_MAKER" } });
    render(<HelpButton collection="users" />);
    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByText("Kullanıcılar")).toBeInTheDocument();
  });

  it("renders English content when the admin locale is English", () => {
    setLocale("en");
    mockUseAuth.mockReturnValue({ user: { role: "GROWTH_MAKER" } });
    render(<HelpButton collection="users" />);
    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("toggles closed again on a second click", () => {
    setLocale("tr");
    mockUseAuth.mockReturnValue({ user: { role: "GROWTH_MAKER" } });
    render(<HelpButton collection="users" />);
    const toggle = screen.getByRole("button", { name: "?" });
    fireEvent.click(toggle);
    expect(screen.getByText("Kullanıcılar")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText("Kullanıcılar")).not.toBeInTheDocument();
  });
});
