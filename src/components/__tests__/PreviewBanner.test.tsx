import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewBanner } from "@/components/PreviewBanner";

describe("PreviewBanner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("embeds the path and the server's own PREVIEW_SECRET in the exit form's action URL", () => {
    vi.stubEnv("PREVIEW_SECRET", "the-secret");
    render(<PreviewBanner path="/kampanyalar/yaz-kampanyasi" />);

    const form = screen.getByRole("button", { name: "Önizlemeden çık" }).closest("form");
    expect(form).toHaveAttribute("method", "POST");
    expect(form?.getAttribute("action")).toBe(
      "/api/preview/disable?path=%2Fkampanyalar%2Fyaz-kampanyasi&secret=the-secret"
    );
  });

  it("still renders a (failing) exit form rather than crashing when no secret is configured", () => {
    vi.stubEnv("PREVIEW_SECRET", "");
    render(<PreviewBanner path="/kampanyalar" />);

    const form = screen.getByRole("button", { name: "Önizlemeden çık" }).closest("form");
    expect(form?.getAttribute("action")).toContain("secret=");
  });
});
