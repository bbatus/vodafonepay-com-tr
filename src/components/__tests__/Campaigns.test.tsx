import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Campaigns } from "@/components/Campaigns";

const campaigns = [
  { title: "Kampanya A", description: "Açıklama A", image: "/a.jpg", imageAlt: "A", href: "/a" },
  { title: "Kampanya B", description: "Açıklama B", image: "/b.jpg", imageAlt: "B", href: "/b" },
];

describe("Campaigns", () => {
  it("renders the first campaign by default", () => {
    render(<Campaigns campaigns={campaigns} />);
    expect(screen.getByText("Kampanya A")).toBeInTheDocument();
  });

  it("advances to the next campaign", async () => {
    const user = userEvent.setup();
    render(<Campaigns campaigns={campaigns} />);

    await user.click(screen.getByLabelText("Sonraki kampanya"));
    expect(screen.getByText("Kampanya B")).toBeInTheDocument();
  });

  it("wraps around to the previous campaign from the first", async () => {
    const user = userEvent.setup();
    render(<Campaigns campaigns={campaigns} />);

    await user.click(screen.getByLabelText("Önceki kampanya"));
    expect(screen.getByText("Kampanya B")).toBeInTheDocument();
  });

  it("renders nothing when given an empty campaign list", () => {
    const { container } = render(<Campaigns campaigns={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to its own default campaigns when none are given", () => {
    render(<Campaigns />);
    expect(screen.getByText(/Vodafone Pay ile Çeşme Plajlarında/)).toBeInTheDocument();
  });
});
