import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideosWithTabs } from "@/components/VideosWithTabs";

describe("VideosWithTabs", () => {
  it("shows the first tab's items by default", () => {
    render(<VideosWithTabs />);
    // "Hesap Doğrulama" only appears in tab 1's item list — "App Store" is in
    // both tabs, so it's not a useful absence check here.
    expect(screen.getByText("Hesap Doğrulama")).toBeInTheDocument();
  });

  it("switches to the second tab's items on click", async () => {
    const user = userEvent.setup();
    render(<VideosWithTabs />);

    await user.click(screen.getByText("Faturana Yansıt'ı nasıl açarım?"));

    expect(screen.getByText("App Store")).toBeInTheDocument();
    expect(screen.queryByText("Hesap Doğrulama")).not.toBeInTheDocument();
  });
});
