import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Breadcrumb } from "@/components/Breadcrumb";
import { QrDownloadBadge } from "@/components/QrDownloadBadge";
import { WhereCanIBuy } from "@/components/WhereCanIBuy";
import { Hero } from "@/components/Hero";
import { LeadFormCta } from "@/components/LeadFormCta";
import { EarnWithCard } from "@/components/EarnWithCard";
import { BrandLogoGrid } from "@/components/BrandLogoGrid";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { VideoGuideSection } from "@/components/VideoGuideSection";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { ProductHero } from "@/components/ProductHero";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { HowToEarn } from "@/components/HowToEarn";
import { StepPhones } from "@/components/StepPhones";

describe("Breadcrumb", () => {
  it("renders the current page label", () => {
    render(<Breadcrumb current="Kampanyalar" />);
    expect(screen.getByText("Kampanyalar")).toBeInTheDocument();
    expect(screen.getByText("Ana Sayfa")).toBeInTheDocument();
  });

  it("renders intermediate trail crumbs between Ana Sayfa and the current page", () => {
    render(<Breadcrumb current="Alt Sayfa" trail={[{ label: "Üst Sayfa", href: "/ust-sayfa" }]} />);
    const link = screen.getByText("Üst Sayfa").closest("a");
    expect(link).toHaveAttribute("href", "/ust-sayfa");
    expect(screen.getByText("Alt Sayfa")).toBeInTheDocument();
  });
});

describe("QrDownloadBadge", () => {
  it("renders the QR image", () => {
    render(<QrDownloadBadge />);
    expect(screen.getByAltText("Vodafone Pay QR Kodu")).toBeInTheDocument();
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

  it("renders the heading and carousel when slides are given", () => {
    render(<EarnWithCard slides={[{ image: "/a.jpg", text: "Kazanç 1" }]} />);
    expect(screen.getByText("Vodafone Pay Kart ile Kazan")).toBeInTheDocument();
  });
});

describe("BrandLogoGrid", () => {
  it("renders nothing when given no brands", () => {
    const { container } = render(<BrandLogoGrid brands={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one image per brand", () => {
    render(
      <BrandLogoGrid
        brands={[
          { name: "Marka A", logo: "/a.svg" },
          { name: "Marka B", logo: "/b.svg" },
        ]}
      />
    );
    expect(screen.getByAltText("Marka A")).toBeInTheDocument();
    expect(screen.getByAltText("Marka B")).toBeInTheDocument();
  });
});

describe("FeatureHighlights", () => {
  it("renders nothing when given no features", () => {
    const { container } = render(<FeatureHighlights features={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each feature's title and description", () => {
    render(<FeatureHighlights features={[{ icon: "/icon.svg", title: "Özellik", description: "Açıklama" }]} />);
    expect(screen.getByText("Özellik")).toBeInTheDocument();
    expect(screen.getByText("Açıklama")).toBeInTheDocument();
  });
});

describe("VideoGuideSection", () => {
  it("renders nothing when given no videos", () => {
    const { container } = render(<VideoGuideSection videos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("embeds each video by its YouTube id", () => {
    render(<VideoGuideSection videos={[{ title: "Nasıl Kullanılır", youtubeId: "abc123" }]} />);
    const frame = screen.getByTitle("Nasıl Kullanılır") as HTMLIFrameElement;
    expect(frame.src).toContain("abc123");
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

describe("AppDownloadBanner", () => {
  it("shows the app-download prompt and dismisses on close", async () => {
    const user = userEvent.setup();
    render(<AppDownloadBanner />);
    expect(screen.getByText("Vodafone Pay uygulamasını indir")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(screen.queryByText("Vodafone Pay uygulamasını indir")).not.toBeInTheDocument();
  });
});

describe("ContentUnavailable", () => {
  it("shows the fetch-failure message for the error variant", () => {
    render(<ContentUnavailable variant="error" />);
    expect(screen.getByText(/şu anda yüklenemiyor/)).toBeInTheDocument();
  });

  it("shows the genuinely-empty message for the empty variant", () => {
    render(<ContentUnavailable variant="empty" />);
    expect(screen.getByText("Şu anda gösterilecek içerik yok.")).toBeInTheDocument();
  });
});

describe("HowToEarn", () => {
  it("renders the heading and each step", () => {
    render(
      <HowToEarn
        heading="Nasıl Kazanırım?"
        image="/img.jpg"
        steps={[{ icon: "/icon.svg", title: "Adım 1", description: "Açıklama 1" }]}
      />
    );
    expect(screen.getByText("Nasıl Kazanırım?")).toBeInTheDocument();
    expect(screen.getByText("Adım 1")).toBeInTheDocument();
  });
});

describe("StepPhones", () => {
  it("renders nothing when given no steps", () => {
    const { container } = render(<StepPhones steps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each step's title and image", () => {
    render(
      <StepPhones
        steps={[{ image: "/img.jpg", imageAlt: "Adım görseli", title: "Adım 1", description: "Açıklama" }]}
      />
    );
    expect(screen.getByText("Adım 1")).toBeInTheDocument();
    expect(screen.getByAltText("Adım görseli")).toBeInTheDocument();
  });
});
