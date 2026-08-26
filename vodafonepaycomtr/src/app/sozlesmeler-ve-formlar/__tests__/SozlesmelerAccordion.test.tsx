import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SozlesmelerAccordion } from "@/app/sozlesmeler-ve-formlar/SozlesmelerAccordion";

const groups = [
  {
    label: "Sözleşmeler ve Formlar",
    documents: [
      { label: "Üyelik Sözleşmesi", href: "/sozlesmeler-ve-formlar/uyelik-sozlesmesi", external: false },
      { label: "PDF Belge", href: "http://localhost:9000/media/x.pdf", external: true, prefix: "İndirmek için:" },
    ],
  },
  {
    label: "Seslendirilmiş Sözleşme ve Formlar",
    documents: [{ label: "Sesli Form", href: "http://localhost:9000/media/x.mp3", external: true }],
  },
];

describe("SozlesmelerAccordion", () => {
  it("starts with the first group open", () => {
    render(<SozlesmelerAccordion groups={groups} />);
    expect(screen.getByText("Üyelik Sözleşmesi")).toBeInTheDocument();
    expect(screen.queryByText("Sesli Form")).not.toBeInTheDocument();
  });

  it("switches open group on click", async () => {
    const user = userEvent.setup();
    render(<SozlesmelerAccordion groups={groups} />);

    await user.click(screen.getByText("Seslendirilmiş Sözleşme ve Formlar"));

    expect(screen.getByText("Sesli Form")).toBeInTheDocument();
    expect(screen.queryByText("Üyelik Sözleşmesi")).not.toBeInTheDocument();
  });

  it("closes the open group on a second click", async () => {
    const user = userEvent.setup();
    render(<SozlesmelerAccordion groups={groups} />);

    await user.click(screen.getByText("Sözleşmeler ve Formlar"));

    expect(screen.queryByText("Üyelik Sözleşmesi")).not.toBeInTheDocument();
  });

  it("renders an internal document as a next/link and an external one as a plain new-tab anchor", () => {
    render(<SozlesmelerAccordion groups={groups} />);

    const internal = screen.getByText("Üyelik Sözleşmesi");
    expect(internal).toHaveAttribute("href", "/sozlesmeler-ve-formlar/uyelik-sozlesmesi");
    expect(internal).not.toHaveAttribute("target");

    const external = screen.getByText("PDF Belge");
    expect(external).toHaveAttribute("href", "http://localhost:9000/media/x.pdf");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the prefix text before a document's label when set", () => {
    render(<SozlesmelerAccordion groups={groups} />);
    expect(screen.getByText("İndirmek için:")).toBeInTheDocument();
  });
});
