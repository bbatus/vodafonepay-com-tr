// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import LocalePreferenceSync from "@/components/LocalePreferenceSync";

const mockUseAuth = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  document.cookie = "payload-lng=; path=/; max-age=0";
  Object.defineProperty(window, "location", { value: { ...window.location, reload: vi.fn() }, writable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocalePreferenceSync", () => {
  it("does nothing when the user has no preferredLocale", () => {
    mockUseAuth.mockReturnValue({ user: {} });
    render(<LocalePreferenceSync />);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("sets the payload-lng cookie and reloads when it differs from the preference", async () => {
    document.cookie = "payload-lng=tr; path=/";
    mockUseAuth.mockReturnValue({ user: { preferredLocale: "en" } });
    render(<LocalePreferenceSync />);
    await waitFor(() => expect(window.location.reload).toHaveBeenCalled());
    expect(document.cookie).toContain("payload-lng=en");
  });

  it("does not reload when the cookie already matches the preference", () => {
    document.cookie = "payload-lng=tr; path=/";
    mockUseAuth.mockReturnValue({ user: { preferredLocale: "tr" } });
    render(<LocalePreferenceSync />);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("renders nothing", () => {
    mockUseAuth.mockReturnValue({ user: { preferredLocale: "tr" } });
    const { container } = render(<LocalePreferenceSync />);
    expect(container).toBeEmptyDOMElement();
  });
});
