import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaydaliBilgilerAccordion } from "@/app/faydali-bilgiler/FaydaliBilgilerAccordion";

describe("FaydaliBilgilerAccordion", () => {
  it("starts open", () => {
    render(<FaydaliBilgilerAccordion />);
    expect(screen.getByText(/Cüzdan kodu ile/)).toBeInTheDocument();
  });

  it("closes and reopens on click", async () => {
    const user = userEvent.setup();
    render(<FaydaliBilgilerAccordion />);

    await user.click(screen.getByText("Faydalı Bilgiler"));
    expect(screen.queryByText(/Cüzdan kodu ile/)).not.toBeInTheDocument();

    await user.click(screen.getByText("Faydalı Bilgiler"));
    expect(screen.getByText(/Cüzdan kodu ile/)).toBeInTheDocument();
  });
});
