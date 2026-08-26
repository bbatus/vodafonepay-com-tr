// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedbackApp from "@/components/FeedbackApp";

const toastSuccess = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: vi.fn() },
}));

beforeEach(() => {
  toastSuccess.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
      if (url.includes("/api/feedback/count")) return Promise.resolve({ ok: true, json: async () => ({ count: 3 }) });
      if (url.includes("/api/feedback/submit")) return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: false, json: async () => ({}) });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FeedbackApp", () => {
  it("loads and shows the running feedback count on mount", async () => {
    render(<FeedbackApp />);
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
  });

  it("disables Send while the message is empty", async () => {
    render(<FeedbackApp />);
    const send = screen.getByRole("button", { name: /Gönder/ });
    expect(send).toBeDisabled();
  });

  it("submits the message and area, shows a thank-you, and refreshes the count", async () => {
    render(<FeedbackApp />);
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Kampanyalar → Yeni Oluştur/), { target: { value: "Kampanyalar" } });
    fireEvent.change(screen.getByPlaceholderText("Ne oldu, ne bekliyordunuz, sizce nasıl olmalıydı?"), { target: { value: "Sürükle bırak kırık" } });

    const send = screen.getByRole("button", { name: /Gönder/ });
    expect(send).not.toBeDisabled();
    fireEvent.click(send);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(screen.getByText("Teşekkürler — geri bildiriminiz bize ulaştı.")).toBeInTheDocument();
  });

  it("shows an error and does not clear the message when the submit fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/translations")) return Promise.resolve({ ok: true, json: async () => ({ docs: [] }) });
        if (url.includes("/api/feedback/count")) return Promise.resolve({ ok: true, json: async () => ({ count: 0 }) });
        if (url.includes("/api/feedback/submit")) return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );
    render(<FeedbackApp />);

    fireEvent.change(screen.getByPlaceholderText("Ne oldu, ne bekliyordunuz, sizce nasıl olmalıydı?"), { target: { value: "test mesajı" } });
    fireEvent.click(screen.getByRole("button", { name: /Gönder/ }));

    await waitFor(() =>
      expect(screen.getByText("Sunucuda beklenmeyen bir hata oluştu. Sorun devam ederse yöneticinize bildirin.")).toBeInTheDocument()
    );
    expect(screen.getByPlaceholderText("Ne oldu, ne bekliyordunuz, sizce nasıl olmalıydı?")).toHaveValue("test mesajı");
  });
});
