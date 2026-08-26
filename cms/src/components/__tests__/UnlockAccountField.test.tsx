// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnlockAccountField from "@/components/UnlockAccountField";
import { ROLES } from "@/access/roles";

const mockUseAuth = vi.fn();
const mockSetLockUntil = vi.fn();
const mockSetLoginAttempts = vi.fn();
let currentLockUntil: string | undefined;
let currentEmail: string | undefined;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
  useField: ({ path }: { path: string }) =>
    path === "lockUntil"
      ? { value: currentLockUntil, setValue: mockSetLockUntil }
      : { value: undefined, setValue: mockSetLoginAttempts },
  useFormFields: (selector: (fields: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ email: { value: currentEmail } }]),
}));

beforeEach(() => {
  currentLockUntil = undefined;
  currentEmail = "locked@vodafone.local";
  mockSetLockUntil.mockClear();
  mockSetLoginAttempts.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UnlockAccountField", () => {
  it("shows 'not locked' and no button when there is no active lock", () => {
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    render(<UnlockAccountField />);
    expect(screen.getByText("Hesap kilitli değil.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows lock status but no unlock button for a role without unlock power", () => {
    currentLockUntil = new Date(Date.now() + 60_000).toISOString();
    mockUseAuth.mockReturnValue({ user: { role: ROLES.GROWTH_CHECKER } });
    render(<UnlockAccountField />);
    expect(screen.getByText(/Kilit bitişi/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets a New Vertical Maker unlock a locked account", async () => {
    currentLockUntil = new Date(Date.now() + 60_000).toISOString();
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    render(<UnlockAccountField />);
    const btn = screen.getByRole("button", { name: "Kilidi Kaldır" });
    fireEvent.click(btn);
    await waitFor(() => expect(mockSetLockUntil).toHaveBeenCalledWith(null));
    expect(mockSetLoginAttempts).toHaveBeenCalledWith(0);
    expect(await screen.findByText("locked@vodafone.local hesabının kilidi kaldırıldı.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/users/unlock",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "locked@vodafone.local" }) })
    );
  });

  it("shows an error message when the unlock request fails", async () => {
    currentLockUntil = new Date(Date.now() + 60_000).toISOString();
    mockUseAuth.mockReturnValue({ user: { role: ROLES.NEW_VERTICAL_MAKER } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: "forbidden" }) })
    );
    render(<UnlockAccountField />);
    fireEvent.click(screen.getByRole("button", { name: "Kilidi Kaldır" }));
    expect(await screen.findByText("forbidden")).toBeInTheDocument();
    expect(mockSetLockUntil).not.toHaveBeenCalled();
  });
});
