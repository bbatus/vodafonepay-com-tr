// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoleAwarePublishButton from "@/components/RoleAwarePublishButton";
import { ROLES } from "@/access/roles";

const mockUseAuth = vi.fn();
const mockUseDocumentInfo = vi.fn();
const mockSubmit = vi.fn();
const mockUseFormModified = vi.fn();
const mockFormFields = vi.fn(() => ({}) as Record<string, { value?: unknown }>);

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
  useAuth: () => mockUseAuth(),
  useDocumentInfo: () => mockUseDocumentInfo(),
  useForm: () => ({ submit: mockSubmit }),
  useFormFields: (sel: (a: [Record<string, { value?: unknown }>]) => unknown) => sel([mockFormFields()]),
  useFormModified: () => mockUseFormModified(),
  useLocale: () => ({ code: "tr" }),
  useConfig: () => ({ config: { routes: { api: "/api" } } }),
}));

function docInfo(overrides: Partial<ReturnType<typeof baseDocInfo>> = {}) {
  return { ...baseDocInfo(), ...overrides };
}
function baseDocInfo() {
  return {
    id: "1",
    collectionSlug: "campaigns",
    globalSlug: undefined,
    hasPublishedDoc: false,
    setHasPublishedDoc: vi.fn(),
    setMostRecentVersionIsAutosaved: vi.fn(),
    setUnpublishedVersionCount: vi.fn(),
    unpublishedVersionCount: 0,
  };
}

beforeEach(() => {
  mockSubmit.mockReset().mockResolvedValue(true);
  mockUseFormModified.mockReturnValue(false);
  mockFormFields.mockReturnValue({});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 0 }) }));
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RoleAwarePublishButton — Growth Maker (cannot publish)", () => {
  it("shows an awaiting notice for an unpublished doc", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1", role: ROLES.GROWTH_MAKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: false }));
    render(<RoleAwarePublishButton />);
    expect(screen.getByTitle(/awaitingTitle|Beklemede|onay/i) ?? screen.getByText(/awaiting/i)).toBeTruthy();
  });

  it("offers a 'request unpublish' action, not a direct unpublish, for a live doc", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1", role: ROLES.GROWTH_MAKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true }));
    render(<RoleAwarePublishButton />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ overrides: expect.objectContaining({ unpublishRequest: "pending" }) })
    );
  });

  it("grants full publish UI to a Growth Maker acting as an active checker delegate", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1", role: ROLES.GROWTH_MAKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalDocs: 1 }) }));
    render(<RoleAwarePublishButton />);
    await waitFor(() => expect(screen.getByRole("button", { name: /publish|yayınla/i })).toBeInTheDocument());
  });
});

describe("RoleAwarePublishButton — a role that can publish", () => {
  it("shows Publish + Reject actions for a new, unpublished doc", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: false }));
    render(<RoleAwarePublishButton />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("opens the confirm modal on Publish click and submits on confirm", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: false }));
    render(<RoleAwarePublishButton />);

    const [, publishBtn] = screen.getAllByRole("button");
    fireEvent.click(publishBtn);

    const confirmBtn = await screen.findByRole("button", { name: /confirm|onayla/i });
    fireEvent.click(confirmBtn);

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ overrides: { _status: "published" } }))
    );
  });

  it("requires a non-empty reason before enabling the reject confirm button", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: false }));
    render(<RoleAwarePublishButton />);

    const [rejectBtn] = screen.getAllByRole("button");
    fireEvent.click(rejectBtn);

    const textarea = await screen.findByRole("textbox");
    const buttons = screen.getAllByRole("button");
    const confirmReject = buttons[buttons.length - 1];
    expect(confirmReject).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "Eksik görsel" } });
    expect(confirmReject).not.toBeDisabled();

    fireEvent.click(confirmReject);
    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ overrides: expect.objectContaining({ reviewStatus: "rejected", rejectionReason: "Eksik görsel" }) })
      )
    );
  });

  it("shows unpublish (not request-unpublish) for a live, unmodified doc", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true }));
    render(<RoleAwarePublishButton />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ overrides: { _status: "draft" } }));
  });

  it("offers unpublish-first and a force-edit escape hatch for a live doc that's been modified", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true }));
    mockUseFormModified.mockReturnValue(true);
    render(<RoleAwarePublishButton />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    const ackCheckbox = await screen.findByRole("checkbox");
    expect(screen.getByRole("button", { name: /confirm|onayla/i })).toBeDisabled();

    fireEvent.click(ackCheckbox);
    expect(screen.getByRole("button", { name: /confirm|onayla/i })).not.toBeDisabled();
  });

  it("hides the reject button once the doc already has a published version", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: ROLES.GROWTH_CHECKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true, unpublishedVersionCount: 0 }));
    mockUseFormModified.mockReturnValue(true);
    render(<RoleAwarePublishButton />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.some((b) => b.textContent?.match(/reject|reddet/i))).toBe(false);
  });
});

describe("RoleAwarePublishButton — pending unpublish request", () => {
  /**
   * A Maker who had already asked for a live campaign to come down still saw
   * "Yayından Kaldırma Talebi Oluştur" and could fire the same request again;
   * the string written for this state was never wired up.
   */
  it("tells a Growth Maker their request is already with the Checker", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: ROLES.GROWTH_MAKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true }));
    mockFormFields.mockReturnValue({ unpublishRequest: { value: "pending" } });

    render(<RoleAwarePublishButton />);

    expect(await screen.findByText("Yayından kaldırma talebiniz Checker onayında.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Yayından Kaldırma Talebi Oluştur/ })).not.toBeInTheDocument();
  });

  it("still offers the request action when none is pending", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: ROLES.GROWTH_MAKER } });
    mockUseDocumentInfo.mockReturnValue(docInfo({ hasPublishedDoc: true }));
    mockFormFields.mockReturnValue({ unpublishRequest: { value: "none" } });

    render(<RoleAwarePublishButton />);

    expect(await screen.findByText("Yayından Kaldırma Talebi Oluştur")).toBeInTheDocument();
  });
});
