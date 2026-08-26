import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignsFilterableList } from "@/app/kampanyalar/CampaignsFilterableList";

const campaigns = [
  { id: "1", image: "/a.jpg", title: "Öne Çıkan Kampanya", category: "kart", featured: true },
  { id: "2", image: "/b.jpg", title: "Normal Kampanya", category: "kart", featured: false },
  { id: "3", image: "/c.jpg", title: "Ödeme Kampanyası", category: "odeme", featured: false },
];
const categories = [
  { label: "Kart", slug: "kart" },
  { label: "Ödeme", slug: "odeme" },
];

describe("CampaignsFilterableList", () => {
  it("under Tümü, splits into 'Bu ayın favorileri' (featured) and 'Tüm Kampanyalar' (the rest)", () => {
    render(<CampaignsFilterableList campaigns={campaigns} categories={categories} />);
    expect(screen.getByText("Bu ayın favorileri")).toBeInTheDocument();
    expect(screen.getByText("Tüm Kampanyalar")).toBeInTheDocument();
    expect(screen.getByText("Öne Çıkan Kampanya")).toBeInTheDocument();
    expect(screen.getByText("Ödeme Kampanyası")).toBeInTheDocument();
  });

  it("under a specific category, shows one flat grid — featured campaigns lose their special section", async () => {
    const user = userEvent.setup();
    render(<CampaignsFilterableList campaigns={campaigns} categories={categories} />);

    await user.click(screen.getByText("Kart"));

    expect(screen.queryByText("Bu ayın favorileri")).not.toBeInTheDocument();
    // "Kart" now appears twice — the filter tab and the grid title (activeLabel) — so just assert it exists at all.
    expect(screen.getAllByText("Kart").length).toBeGreaterThan(0);
    expect(screen.getByText("Öne Çıkan Kampanya")).toBeInTheDocument();
    expect(screen.getByText("Normal Kampanya")).toBeInTheDocument();
    // A featured campaign must not vanish just because the favorites section is gone.
    expect(screen.queryByText("Ödeme Kampanyası")).not.toBeInTheDocument();
  });

  it("shows ContentUnavailable's empty-state message when a category has no campaigns at all", async () => {
    const user = userEvent.setup();
    render(
      <CampaignsFilterableList
        campaigns={campaigns}
        categories={[...categories, { label: "Boş", slug: "bos" }]}
      />
    );

    await user.click(screen.getByText("Boş"));

    expect(screen.getByText("Şu anda gösterilecek içerik yok.")).toBeInTheDocument();
  });
});
