import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("NotFound", () => {
  it("shows the 404 message and a link back home", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Ana Sayfaya Dön")).toHaveAttribute("href", "/");
  });
});
