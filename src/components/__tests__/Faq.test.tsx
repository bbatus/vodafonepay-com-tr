import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq } from "@/components/Faq";

const items = [
  { question: "Soru 1?", answer: "Cevap 1" },
  { question: "Soru 2?", answer: "Cevap 2" },
];

describe("Faq", () => {
  it("renders the heading by default", () => {
    render(<Faq items={items} />);
    expect(screen.getByText("Sıkça Sorulan Sorular")).toBeInTheDocument();
  });

  it("hides the heading when showHeading is false", () => {
    render(<Faq items={items} showHeading={false} />);
    expect(screen.queryByText("Sıkça Sorulan Sorular")).not.toBeInTheDocument();
  });

  it("renders all questions, answers collapsed by default", () => {
    render(<Faq items={items} />);
    expect(screen.getByText("Soru 1?")).toBeInTheDocument();
    expect(screen.getByText("Soru 2?")).toBeInTheDocument();
    expect(screen.queryByText("Cevap 1")).not.toBeInTheDocument();
  });

  it("toggles an answer open and closed on click", async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);

    await user.click(screen.getByText("Soru 1?"));
    expect(screen.getByText("Cevap 1")).toBeInTheDocument();

    await user.click(screen.getByText("Soru 1?"));
    expect(screen.queryByText("Cevap 1")).not.toBeInTheDocument();
  });

  it("only shows one answer open at a time", async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);

    await user.click(screen.getByText("Soru 1?"));
    expect(screen.getByText("Cevap 1")).toBeInTheDocument();

    await user.click(screen.getByText("Soru 2?"));
    expect(screen.queryByText("Cevap 1")).not.toBeInTheDocument();
    expect(screen.getByText("Cevap 2")).toBeInTheDocument();
  });

  // RFP feedback 5.0: the built-in 4-question default is gone — an empty list
  // renders nothing instead of copy the CMS can't reach.
  it("renders nothing when given an empty item list", () => {
    const { container } = render(<Faq items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
