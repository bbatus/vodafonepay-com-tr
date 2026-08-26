// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import FooterOrderField from "@/components/FooterOrderField";

const mockUseField = vi.fn();
let currentWatched: unknown;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useField: () => mockUseField(),
  useFormFields: (selector: (fields: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ showInFooter: { value: currentWatched } }]),
  NumberField: ({ path }: { path: string }) => <input data-testid={`number-${path}`} />,
}));

beforeEach(() => {
  currentWatched = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const baseProps = {
  collection: "campaigns",
  watchPath: "showInFooter",
  max: 4,
  path: "footerOrder",
  field: {} as never,
};

describe("FooterOrderField", () => {
  it("shows nothing extra when the watched checkbox is unchecked", () => {
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    render(<FooterOrderField {...baseProps} />);
    expect(screen.queryByText(/kayıt var/)).not.toBeInTheDocument();
  });

  it("auto-fills the first free slot when the field is empty and a slot is checked", async () => {
    currentWatched = true;
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: undefined, setValue });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 1, docs: [{ footerOrder: 1 }] }) })
    );
    render(<FooterOrderField {...baseProps} />);
    await waitFor(() => expect(setValue).toHaveBeenCalledWith(2));
    expect(screen.getByText(/1\/4 kayıt var/)).toBeInTheDocument();
  });

  it("does not overwrite an already-set value on load", async () => {
    currentWatched = true;
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: 3, setValue });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 1, docs: [{ footerOrder: 1 }] }) })
    );
    render(<FooterOrderField {...baseProps} />);
    await waitFor(() => expect(screen.getByText(/1\/4 kayıt var/)).toBeInTheDocument());
    expect(setValue).not.toHaveBeenCalled();
  });

  it("shows the full message when every slot is taken", async () => {
    currentWatched = true;
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalDocs: 4,
          docs: [{ footerOrder: 1 }, { footerOrder: 2 }, { footerOrder: 3 }, { footerOrder: 4 }],
        }),
      })
    );
    render(<FooterOrderField {...baseProps} />);
    await waitFor(() =>
      expect(
        screen.getByText(/Footer zaten dolu \(4\/4\) — yeni birini eklemeden önce birini kaldırın/)
      ).toBeInTheDocument()
    );
  });

  it("resets on uncheck so a later re-check can auto-fill again", async () => {
    currentWatched = true;
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: undefined, setValue });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 0, docs: [] }) })
    );
    const { rerender } = render(<FooterOrderField {...baseProps} />);
    await waitFor(() => expect(setValue).toHaveBeenCalledWith(1));

    currentWatched = undefined;
    rerender(<FooterOrderField {...baseProps} />);
    expect(screen.queryByText(/kayıt var/)).not.toBeInTheDocument();
  });
});
