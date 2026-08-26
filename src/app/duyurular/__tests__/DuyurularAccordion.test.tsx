import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuyurularAccordion } from "@/app/duyurular/DuyurularAccordion";

describe("DuyurularAccordion", () => {
  it("renders nothing when given no items", () => {
    const { container } = render(<DuyurularAccordion items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("starts with the first item open", () => {
    render(
      <DuyurularAccordion
        items={[
          { title: "Duyuru 1", body: "İçerik 1" },
          { title: "Duyuru 2", body: "İçerik 2" },
        ]}
      />
    );
    expect(screen.getByText("İçerik 1")).toBeInTheDocument();
    expect(screen.queryByText("İçerik 2")).not.toBeInTheDocument();
  });

  it("switches which item is open on click, and closes it again on a second click", async () => {
    const user = userEvent.setup();
    render(
      <DuyurularAccordion
        items={[
          { title: "Duyuru 1", body: "İçerik 1" },
          { title: "Duyuru 2", body: "İçerik 2" },
        ]}
      />
    );

    await user.click(screen.getByText("Duyuru 2"));
    expect(screen.getByText("İçerik 2")).toBeInTheDocument();
    expect(screen.queryByText("İçerik 1")).not.toBeInTheDocument();

    await user.click(screen.getByText("Duyuru 2"));
    expect(screen.queryByText("İçerik 2")).not.toBeInTheDocument();
  });

  it("renders a deeplink when set, and omits it when unset", async () => {
    const user = userEvent.setup();
    render(
      <DuyurularAccordion
        items={[
          { title: "Linkli", body: "x", deeplink: "/kampanyalar/x" },
          { title: "Linksiz", body: "y" },
        ]}
      />
    );
    expect(screen.getByText("Devamını gör →")).toHaveAttribute("href", "/kampanyalar/x");

    await user.click(screen.getByText("Linksiz"));
    expect(screen.queryByText("Devamını gör →")).not.toBeInTheDocument();
  });
});
