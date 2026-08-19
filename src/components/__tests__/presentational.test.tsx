import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StickyQr } from "@/components/StickyQr";
import { WhereCanIBuy } from "@/components/WhereCanIBuy";
import { Hero } from "@/components/Hero";
import { LeadFormCta } from "@/components/LeadFormCta";
import { EarnWithCard } from "@/components/EarnWithCard";
import { BrandLogoGrid } from "@/components/BrandLogoGrid";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { VideoGuideSection } from "@/components/VideoGuideSection";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { ProductHero } from "@/components/ProductHero";

describe("Breadcrumb", () => {
  it("renders the current page label", () => {
    render(<Breadcrumb current="Kampanyalar" />);
    expect(screen.getByText("Kampanyalar")).toBeInTheDocument();
    expect(screen.getByText("Ana Sayfa")).toBeInTheDocument();
  });
});

describe("StickyQr", () => {
  it("renders the QR image", () => {
    render(<StickyQr />);
    expect(screen.getByAltText("QR Code")).toBeInTheDocument();
  });
});

describe("WhereCanIBuy", () => {
  it("renders the heading", () => {
    render(<WhereCanIBuy />);
    expect(screen.getByText("Nereden satın alabilirim?")).toBeInTheDocument();
  });
});

describe("Hero", () => {
  it("renders the Vodafone Pay tagline", () => {
    render(<Hero />);
    expect(screen.getAllByText("Ödemenin Akıllı Hali").length).toBeGreaterThan(0);
  });
});

describe("LeadFormCta", () => {
  it("renders the CTA button", () => {
    render(<LeadFormCta />);
    expect(screen.getByText("Formu doldurun")).toBeInTheDocument();
  });
});

describe("EarnWithCard", () => {
  it("renders nothing when given no slides", () => {
    const { container } = render(<EarnWithCard slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("BrandLogoGrid", () => {
  it("renders nothing when given no brands", () => {
    const { container } = render(<BrandLogoGrid brands={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("FeatureHighlights", () => {
  it("renders nothing when given no features", () => {
    const { container } = render(<FeatureHighlights features={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("VideoGuideSection", () => {
  it("renders nothing when given no videos", () => {
    const { container } = render(<VideoGuideSection videos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("CardsWithIcons", () => {
  it("renders title, description, and cards", () => {
    render(
      <CardsWithIcons
        title="Başlık"
        description="Açıklama"
        cards={[{ icon: "/icon.svg", title: "Kart 1", text: "Metin" }]}
      />
    );
    expect(screen.getByText("Başlık")).toBeInTheDocument();
    expect(screen.getByText("Kart 1")).toBeInTheDocument();
  });
});

describe("ProductHero", () => {
  it("renders the heading and image", () => {
    render(<ProductHero image="/img.jpg" imageAlt="alt text" heading="Başlık" />);
    expect(screen.getByAltText("alt text")).toBeInTheDocument();
  });
});
