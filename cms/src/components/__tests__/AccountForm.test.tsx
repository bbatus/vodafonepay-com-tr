// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountForm from "@/components/AccountForm";
import { ROLES } from "@/access/roles";

const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: (...args: unknown[]) => toastError(...args) },
}));

const baseUser = {
  id: "1",
  email: "editor@vodafone.local",
  username: "editor.k",
  role: ROLES.GROWTH_MAKER,
  preferredLocale: "tr",
};

beforeEach(() => {
  toastError.mockClear();
  toastSuccess.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    })
  );
  // AccountForm reloads the page after a successful save — jsdom can't
  // navigate, so make it a harmless no-op for these tests.
  Object.defineProperty(window, "location", { value: { ...window.location, reload: vi.fn() }, writable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccountForm", () => {
  it("renders email/username/role as read-only text, never as editable inputs", () => {
    render(<AccountForm user={baseUser} />);
    expect(screen.getByText("editor@vodafone.local")).toBeInTheDocument();
    expect(screen.getByText("editor.k")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /e-posta|email/i })).not.toBeInTheDocument();
  });

  it("disables the locale Save button until the selection actually changes", () => {
    render(<AccountForm user={baseUser} />);
    const save = screen.getByRole("button", { name: "Kaydet" });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "en" } });
    expect(save).not.toBeDisabled();
  });

  it("saves the new locale via PATCH and sets the payload-lng cookie", async () => {
    render(<AccountForm user={baseUser} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/1",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ preferredLocale: "en" }) })
      )
    );
    await waitFor(() => expect(document.cookie).toContain("payload-lng=en"));
  });

  it("rejects an oversized avatar client-side before ever hitting the network", async () => {
    render(<AccountForm user={baseUser} />);
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], "avatar.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalledWith("/api/users/me/avatar", expect.anything());
  });

  it("rejects a non-image file type client-side", async () => {
    render(<AccountForm user={baseUser} />);
    const badFile = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it("uploads a valid avatar and reloads the page on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        if (url.includes("/api/users/me/avatar")) {
          return Promise.resolve({ ok: true, json: async () => ({ doc: { avatar: { url: "/media/avatar.png" } } }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      })
    );
    render(<AccountForm user={baseUser} />);
    const goodFile = new File(["x"], "avatar.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [goodFile] } });

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(window.location.reload).toHaveBeenCalled();
  });
});
