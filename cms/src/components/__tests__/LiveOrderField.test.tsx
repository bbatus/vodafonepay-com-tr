// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LiveOrderField from "@/components/LiveOrderField";

const mockUseField = vi.fn();
let currentWatched: unknown;

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useField: () => mockUseField(),
  useFormFields: (selector: (fields: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ category: { value: currentWatched } }]),
  NumberField: ({ path }: { path: string }) => <input data-testid={`number-${path}`} />,
}));

beforeEach(() => {
  currentWatched = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const baseProps = { collection: "faq-items", watchPath: "category", mode: "relationship" as const, path: "order", field: {} as never };

describe("LiveOrderField", () => {
  it("shows nothing extra when the watched group field is empty", () => {
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    render(<LiveOrderField {...baseProps} />);
    expect(screen.queryByText(/kayıt var/)).not.toBeInTheDocument();
  });

  it("fetches and shows the count + suggested order once a group is picked", async () => {
    currentWatched = "cat-1";
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 2, docs: [{ order: 2 }] }) })
    );
    render(<LiveOrderField {...baseProps} />);
    await waitFor(() => expect(screen.getByText(/2 kayıt var/)).toBeInTheDocument());
    expect(screen.getByText(/önerilen sıra: 3/)).toBeInTheDocument();
  });

  it("only writes the suggested value when 'use suggested' is explicitly clicked", async () => {
    currentWatched = "cat-1";
    const setValue = vi.fn();
    mockUseField.mockReturnValue({ value: 1, setValue });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 2, docs: [{ order: 2 }] }) })
    );
    render(<LiveOrderField {...baseProps} />);
    const useBtn = await screen.findByRole("button", { name: /3 kullan/ });
    expect(setValue).not.toHaveBeenCalled();
    fireEvent.click(useBtn);
    expect(setValue).toHaveBeenCalledWith(3);
  });

  it("hides the 'use suggested' button once the value already equals it", async () => {
    currentWatched = "cat-1";
    mockUseField.mockReturnValue({ value: 3, setValue: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 2, docs: [{ order: 2 }] }) })
    );
    render(<LiveOrderField {...baseProps} />);
    await waitFor(() => expect(screen.getByText(/önerilen sıra: 3/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /kullan/ })).not.toBeInTheDocument();
  });

  it("collapses a boolean-mode watch value to a single group key", async () => {
    currentWatched = true;
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 0, docs: [] }) })
    );
    render(<LiveOrderField {...baseProps} mode="boolean" />);
    await waitFor(() => expect(screen.getByText(/önerilen sıra: 1/)).toBeInTheDocument());
  });

  it("flat mode fetches immediately with no watchPath and no group filter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 4, docs: [{ order: 4 }] }) });
    vi.stubGlobal("fetch", fetchMock);
    mockUseField.mockReturnValue({ value: undefined, setValue: vi.fn() });
    render(<LiveOrderField {...baseProps} watchPath={undefined} mode="flat" />);
    await waitFor(() => expect(screen.getByText(/4 kayıt var/)).toBeInTheDocument());
    expect(screen.getByText(/önerilen sıra: 5/)).toBeInTheDocument();
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("where[");
  });
});
