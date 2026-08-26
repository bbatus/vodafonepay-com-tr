import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlogFilterableList } from "@/app/blog/BlogFilterableList";

const posts = [
  { id: "1", image: "/a.jpg", title: "Yazı A", category: "kart" },
  { id: "2", image: "/b.jpg", title: "Yazı B", category: "odeme" },
];
const categories = [
  { label: "Kart", slug: "kart" },
  { label: "Ödeme", slug: "odeme" },
];

describe("BlogFilterableList", () => {
  it("shows every post under Tümü", () => {
    render(<BlogFilterableList posts={posts} categories={categories} />);
    expect(screen.getByText("Yazı A")).toBeInTheDocument();
    expect(screen.getByText("Yazı B")).toBeInTheDocument();
  });

  it("filters to only the selected category's posts", async () => {
    const user = userEvent.setup();
    render(<BlogFilterableList posts={posts} categories={categories} />);

    await user.click(screen.getByText("Kart"));

    expect(screen.getByText("Yazı A")).toBeInTheDocument();
    expect(screen.queryByText("Yazı B")).not.toBeInTheDocument();
  });

  it("shows an explicit empty-state message for a category with no posts, not a blank grid", async () => {
    const user = userEvent.setup();
    render(
      <BlogFilterableList
        posts={posts}
        categories={[...categories, { label: "Boş Kategori", slug: "bos" }]}
      />
    );

    await user.click(screen.getByText("Boş Kategori"));

    expect(screen.getByText("Bu kategoride henüz yazı yok.")).toBeInTheDocument();
    expect(screen.queryByText("Yazı A")).not.toBeInTheDocument();
  });
});
