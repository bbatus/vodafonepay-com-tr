// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AutoSlugField from "@/components/AutoSlugField";

const mockUseDocumentInfo = vi.fn();
const mockUseField = vi.fn();

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useDocumentInfo: () => mockUseDocumentInfo(),
  useField: () => mockUseField(),
  useFormFields: (selector: (fields: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ title: { value: "Yaz Kampanyası" } }]),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AutoSlugField", () => {
  it("derives and writes the slug from the title on a brand-new (id-less) document", () => {
    const setValue = vi.fn();
    mockUseDocumentInfo.mockReturnValue({ id: undefined });
    mockUseField.mockReturnValue({ value: "", setValue });
    render(<AutoSlugField />);
    expect(setValue).toHaveBeenCalledWith("yaz-kampanyasi");
  });

  it("shows the live-tracking hint for a new document", () => {
    mockUseDocumentInfo.mockReturnValue({ id: undefined });
    mockUseField.mockReturnValue({ value: "yaz-kampanyasi", setValue: vi.fn() });
    render(<AutoSlugField />);
    expect(screen.getByText("yaz-kampanyasi")).toBeInTheDocument();
  });

  it("never rewrites the slug once the document already has an id (frozen)", () => {
    const setValue = vi.fn();
    mockUseDocumentInfo.mockReturnValue({ id: "42" });
    mockUseField.mockReturnValue({ value: "eski-slug", setValue });
    render(<AutoSlugField />);
    expect(setValue).not.toHaveBeenCalled();
    expect(screen.getByText("eski-slug")).toBeInTheDocument();
  });

  it("shows a placeholder dash when there is no value yet", () => {
    mockUseDocumentInfo.mockReturnValue({ id: "42" });
    mockUseField.mockReturnValue({ value: "", setValue: vi.fn() });
    render(<AutoSlugField />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("prefixes the shown URL with urlPrefix", () => {
    mockUseDocumentInfo.mockReturnValue({ id: "42" });
    mockUseField.mockReturnValue({ value: "kampanya-a", setValue: vi.fn() });
    render(<AutoSlugField urlPrefix="/kampanyalar/" />);
    expect(screen.getByText("/kampanyalar/kampanya-a")).toBeInTheDocument();
  });
});
