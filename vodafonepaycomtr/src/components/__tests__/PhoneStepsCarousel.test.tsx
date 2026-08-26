import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneStepsCarousel } from "@/components/PhoneStepsCarousel";

const steps = [
  { number: "01", text: "Adım bir", image: "/s1.jpg" },
  { number: "02", text: "Adım iki", image: "/s2.jpg" },
  { number: "03", text: "Adım üç", image: "/s3.jpg" },
];

describe("PhoneStepsCarousel", () => {
  it("renders the heading and starts on the first step", () => {
    render(<PhoneStepsCarousel heading="Nasıl Kullanırım?" steps={steps} />);
    expect(screen.getByText("Nasıl Kullanırım?")).toBeInTheDocument();
    expect(screen.getAllByText("Adım bir").length).toBeGreaterThan(0);
  });

  it.each([
    ["Sonraki adım (advances forward)", "Sonraki adım", "Adım iki"],
    ["Önceki adım (wraps backward from the first step)", "Önceki adım", "Adım üç"],
    ["a dot button (jumps directly to that step)", "Adım 03", "Adım üç"],
  ])("navigates via %s", async (_label, controlLabel, expectedText) => {
    const user = userEvent.setup();
    render(<PhoneStepsCarousel heading="h" steps={steps} />);

    await user.click(screen.getByLabelText(controlLabel));

    expect(screen.getAllByText(expectedText).length).toBeGreaterThan(0);
  });
});
