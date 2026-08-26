import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardListGrid, CardListCard } from "@/components/CardListGrid";

const baseItem = { image: "/img.jpg", title: "Kampanya A" };

describe("CardListGrid", () => {
  it("renders the section title and one card per item", () => {
    render(
      <CardListGrid
        title="Kampanyalar"
        items={[
          { ...baseItem, id: "1", title: "Kampanya A" },
          { ...baseItem, id: "2", title: "Kampanya B" },
        ]}
      />
    );
    expect(screen.getByText("Kampanyalar")).toBeInTheDocument();
    expect(screen.getByText("Kampanya A")).toBeInTheDocument();
    expect(screen.getByText("Kampanya B")).toBeInTheDocument();
  });

  it("falls back to title as the React key when no id is given — should not throw or dedupe distinct items", () => {
    render(<CardListGrid title="Kampanyalar" items={[{ ...baseItem, title: "Tek Kampanya" }]} />);
    expect(screen.getByText("Tek Kampanya")).toBeInTheDocument();
  });
});

describe("CardListCard", () => {
  it("renders as a link when href is set", () => {
    render(<CardListCard item={{ ...baseItem, href: "/kampanyalar/a" }} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/kampanyalar/a");
  });

  it("renders as a button (no navigation) when href is unset", () => {
    render(<CardListCard item={baseItem} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the item's own CTA label over the grid's shared one", () => {
    render(<CardListCard item={{ ...baseItem, linkLabel: "Hemen İncele" }} linkLabel="Detayları gör" />);
    expect(screen.getByText("Hemen İncele")).toBeInTheDocument();
    expect(screen.queryByText("Detayları gör")).not.toBeInTheDocument();
  });

  it("falls back to the grid's shared CTA label when the item has none", () => {
    render(<CardListCard item={baseItem} linkLabel="Detayları gör" />);
    expect(screen.getByText("Detayları gör")).toBeInTheDocument();
  });

  it("omits the description paragraph when unset", () => {
    const { container } = render(<CardListCard item={baseItem} />);
    expect(container.querySelector("p.line-clamp-3")).toBeNull();
  });

  it("renders the campaign date range when dates are set", () => {
    render(<CardListCard item={{ ...baseItem, startDate: "2026-07-14", endDate: "2026-08-15" }} />);
    expect(screen.getByText(/14\.07\.2026 - 15\.08\.2026/)).toBeInTheDocument();
  });
});
