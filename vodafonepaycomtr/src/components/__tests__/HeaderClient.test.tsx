import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderClient } from "@/components/HeaderClient";
import type { NavLink } from "@/types/homepage";

const productLinks: NavLink[] = [{ label: "Vodafone Pay Kart", href: "/vodafone-pay-kart" }];
const navLinks: NavLink[] = [{ label: "Kampanyalar", href: "/kampanyalar" }];

describe("HeaderClient", () => {
  it("opens the mobile menu drawer on the hamburger button and closes it on the close button", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={productLinks} navLinks={navLinks} />);

    expect(screen.queryByLabelText("Menüyü kapat")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Menüyü aç"));
    expect(screen.getAllByLabelText("Menüyü kapat").length).toBeGreaterThan(0);

    await user.click(screen.getAllByLabelText("Menüyü kapat")[0]);
    expect(screen.queryByLabelText("Menüyü kapat")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={productLinks} navLinks={navLinks} />);

    await user.click(screen.getByLabelText("Menüyü aç"));
    const backdrop = screen.getAllByLabelText("Menüyü kapat")[0];
    await user.click(backdrop);

    expect(screen.queryByLabelText("Menüyü kapat")).not.toBeInTheDocument();
  });

  it("shows the desktop Ürünler dropdown on hover", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={productLinks} navLinks={navLinks} />);

    expect(screen.queryByRole("link", { name: "Vodafone Pay Kart" })).not.toBeInTheDocument();

    const trigger = screen.getByText("Ürünler", { selector: "button" });
    await user.hover(trigger.parentElement as HTMLElement);
    expect(screen.getByRole("link", { name: "Vodafone Pay Kart" })).toBeInTheDocument();

    await user.unhover(trigger.parentElement as HTMLElement);
    expect(screen.queryByRole("link", { name: "Vodafone Pay Kart" })).not.toBeInTheDocument();
  });

  it("toggles the mobile Ürünler accordion on click", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={productLinks} navLinks={navLinks} />);
    await user.click(screen.getByLabelText("Menüyü aç"));

    const accordionButton = screen.getByText("Ürünler", { selector: "span" }).closest("button") as HTMLElement;
    expect(screen.queryAllByRole("link", { name: "Vodafone Pay Kart" })).toHaveLength(0);

    await user.click(accordionButton);
    expect(screen.getAllByRole("link", { name: "Vodafone Pay Kart" }).length).toBeGreaterThan(0);

    await user.click(accordionButton);
    expect(screen.queryAllByRole("link", { name: "Vodafone Pay Kart" })).toHaveLength(0);
  });

  it("uses mobileHref over href for mobile drawer links when set, but the desktop link keeps using href", async () => {
    const user = userEvent.setup();
    const linksWithMobileOverride: NavLink[] = [
      { label: "Kampanyalar", href: "/kampanyalar", mobileHref: "/kampanyalar-mobil" },
    ];
    render(<HeaderClient productLinks={[]} navLinks={linksWithMobileOverride} />);

    // Desktop nav renders unconditionally alongside the mobile bar in jsdom (no real viewport media query).
    const desktopLink = screen.getAllByRole("link", { name: "Kampanyalar" })[0];
    expect(desktopLink).toHaveAttribute("href", "/kampanyalar");

    await user.click(screen.getByLabelText("Menüyü aç"));
    const mobileLink = screen.getAllByRole("link", { name: "Kampanyalar" }).find((a) => a.closest(".fixed"));
    expect(mobileLink).toHaveAttribute("href", "/kampanyalar-mobil");
  });

  it("falls back to href when mobileHref is unset", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={[]} navLinks={navLinks} />);
    await user.click(screen.getByLabelText("Menüyü aç"));

    const mobileLink = screen.getAllByRole("link", { name: "Kampanyalar" }).find((a) => a.closest(".fixed"));
    expect(mobileLink).toHaveAttribute("href", "/kampanyalar");
  });

  it("closes the mobile menu after clicking a nav link", async () => {
    const user = userEvent.setup();
    render(<HeaderClient productLinks={[]} navLinks={navLinks} />);
    await user.click(screen.getByLabelText("Menüyü aç"));

    const mobileLink = screen.getAllByRole("link", { name: "Kampanyalar" }).find((a) => a.closest(".fixed")) as HTMLElement;
    await user.click(mobileLink);

    expect(screen.queryByLabelText("Menüyü kapat")).not.toBeInTheDocument();
  });
});
