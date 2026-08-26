import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqCategoryFilter } from "@/app/sikca-sorulan-sorular/FaqCategoryFilter";

const items = [
  { question: "Kart sorusu?", answer: "Cevap", category: "kart" },
  { question: "Ödeme sorusu?", answer: "Cevap", category: "odeme" },
];
const categories = [
  { label: "Kart", slug: "kart" },
  { label: "Ödeme", slug: "odeme" },
];

describe("FaqCategoryFilter", () => {
  it("renders the page heading and every question under Tümü", () => {
    render(<FaqCategoryFilter items={items} categories={categories} />);
    expect(screen.getByRole("heading", { name: "Sıkça Sorulan Sorular" })).toBeInTheDocument();
    expect(screen.getByText("Kart sorusu?")).toBeInTheDocument();
    expect(screen.getByText("Ödeme sorusu?")).toBeInTheDocument();
  });

  it("filters to the selected category's questions", async () => {
    const user = userEvent.setup();
    render(<FaqCategoryFilter items={items} categories={categories} />);

    await user.click(screen.getByText("Kart"));

    expect(screen.getByText("Kart sorusu?")).toBeInTheDocument();
    expect(screen.queryByText("Ödeme sorusu?")).not.toBeInTheDocument();
  });

  it("shows an explicit empty-state message for a category with no questions", async () => {
    const user = userEvent.setup();
    render(<FaqCategoryFilter items={items} categories={[...categories, { label: "Boş", slug: "bos" }]} />);

    await user.click(screen.getByText("Boş"));

    expect(screen.getByText("Bu kategoride henüz soru yok.")).toBeInTheDocument();
  });

  it("tolerates items being undefined (CMS returned nothing)", () => {
    render(<FaqCategoryFilter categories={categories} />);
    expect(screen.getByRole("heading", { name: "Sıkça Sorulan Sorular" })).toBeInTheDocument();
  });
});
