import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd, OrganizationJsonLd } from "@/components/JsonLd";

const parse = (container: HTMLElement) => {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.innerHTML) : null;
};

describe("JsonLd", () => {
  it("emits an Organization graph for the site", () => {
    const { container } = render(<OrganizationJsonLd />);
    const data = parse(container);
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("Vodafone Pay");
  });

  it("turns FAQ items into a FAQPage with one Question each", () => {
    const { container } = render(
      <FaqJsonLd items={[{ question: "Nedir?", answer: "Budur." }, { question: "Nasıl?", answer: "Şöyle." }]} />
    );
    const data = parse(container);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(2);
    expect(data.mainEntity[0].acceptedAnswer.text).toBe("Budur.");
  });

  it("emits nothing for an empty FAQ — an empty FAQPage is a structured-data error", () => {
    const { container } = render(<FaqJsonLd items={[]} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("builds an Article and omits the fields that were not supplied", () => {
    const { container } = render(<ArticleJsonLd title="Yazı" path="/blog/yazi" />);
    const data = parse(container);
    expect(data["@type"]).toBe("Article");
    expect(data.headline).toBe("Yazı");
    expect(data).not.toHaveProperty("datePublished");
    expect(data).not.toHaveProperty("image");
  });

  it("puts Ana Sayfa first and the current page last in the breadcrumb, without duplicating it", () => {
    const { container } = render(
      <BreadcrumbJsonLd current="Yazı" path="/blog/yazi" trail={[{ label: "Blog", href: "/blog" }]} />
    );
    const data = parse(container);
    expect(data.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Ana Sayfa", "Blog", "Yazı"]);
    expect(data.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2, 3]);
  });

  it("escapes < so a string containing </script> cannot close the tag early", () => {
    const { container } = render(<ArticleJsonLd title={'</script><img onerror=x>'} path="/blog/x" />);
    const html = container.querySelector("script")!.innerHTML;
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c");
  });
});
