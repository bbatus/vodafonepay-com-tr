import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductHero } from "@/components/ProductHero";

/**
 * These pin the shape measured on vodafonepay.com.tr's own product hero
 * (/aninda-bakiye, /qr-ile-faturana-yansit — both identical): the copy is a
 * white overlay ON the image from lg up, and a `#f3f4f6` strip UNDER the image
 * below lg. The component previously drew that grey strip at every breakpoint
 * with `py-8`, so desktop showed a 96px grey slab the real site never renders.
 */
describe("ProductHero", () => {
  const base = { image: "/hero.jpg", imageAlt: "Hero", heading: "Başlık" };

  it("keeps exactly one h1 even though the copy is rendered for both breakpoints", () => {
    render(<ProductHero {...base} subheading="Alt başlık" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText("Başlık")).toHaveLength(2);
  });

  it("shows the heading overlay only from lg up, and the grey strip only below lg", () => {
    const { container } = render(<ProductHero {...base} />);

    const overlay = container.querySelector("h1")?.parentElement;
    expect(overlay?.className).toContain("hidden");
    expect(overlay?.className).toContain("lg:flex");
    // Positioned over the image, which is what makes it an overlay at all.
    expect(overlay?.className).toContain("absolute");

    const strip = [...container.querySelectorAll("div")].find((d) => d.className.includes("bg-[#f3f4f6]"));
    expect(strip).toBeDefined();
    expect(strip?.className).toContain("lg:hidden");
  });

  it("never pads the mobile strip out into a tall slab (live hugs the text with my-[10px])", () => {
    const { container } = render(<ProductHero {...base} />);
    const strip = [...container.querySelectorAll("div")].find((d) => d.className.includes("bg-[#f3f4f6]"));
    expect(strip?.className).not.toContain("py-8");
    expect(strip?.querySelector("div")?.className).toContain("my-[10px]");
  });

  it("renders the CTA in both branches when a label and url are given, and omits it otherwise", () => {
    const { rerender } = render(<ProductHero {...base} ctaLabel="Hemen Başla" ctaUrl="/kampanyalar" />);
    const links = screen.getAllByRole("link", { name: "Hemen Başla" });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/kampanyalar");

    rerender(<ProductHero {...base} ctaLabel="Hemen Başla" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the live image geometry: 1030px-wide column, rounded-xl, 322px tall on desktop", () => {
    const { container } = render(<ProductHero {...base} />);
    expect(container.querySelector("section")?.className).toContain("max-w-[1030px]");
    const frame = container.querySelector("section > div");
    expect(frame?.className).toContain("rounded-xl");
    expect(container.querySelector("img")?.className).toContain("lg:h-[322px]");
  });
});
