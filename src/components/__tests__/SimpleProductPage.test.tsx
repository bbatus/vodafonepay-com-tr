import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimpleProductPage } from "@/components/SimpleProductPage";
import {
  getFaqItems,
  getFeatureCards,
  getNavLinks,
  getPageMeta,
  getProductHero,
  getStepCards,
} from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getFaqItems: vi.fn(),
    getProductHero: vi.fn(),
    getFeatureCards: vi.fn(),
    getStepCards: vi.fn(),
    getPageMeta: vi.fn(),
    getNavLinks: vi.fn(),
  };
});

// Header/Footer are themselves async Server Components fetching their own CMS
// data — react-dom's client renderer (what RTL uses) can't resolve a nested
// async component the way Next.js's RSC runtime does, so they're stubbed here
// to isolate SimpleProductPage's own CMS-vs-fallback branching, which is what
// this file actually tests.
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

const fallbackCards = [{ icon: "/icon.svg", title: "Yedek Kart", text: "Yedek metin" }];
const fallbackSteps = [{ number: "01", text: "Yedek adım", image: "/step.jpg" }];

function mockCmsEmpty() {
  vi.mocked(getFaqItems).mockResolvedValue(null);
  vi.mocked(getProductHero).mockResolvedValue(null);
  vi.mocked(getFeatureCards).mockResolvedValue(null);
  vi.mocked(getStepCards).mockResolvedValue(null);
  vi.mocked(getPageMeta).mockResolvedValue(null);
  vi.mocked(getNavLinks).mockResolvedValue(null);
}

async function renderPage() {
  render(
    await SimpleProductPage({
      pageKey: "aninda-bakiye",
      breadcrumbLabel: "Anında Bakiye",
      heroImage: "/hero.jpg",
      heroImageAlt: "Anında Bakiye",
      heroHeading: "Varsayılan Başlık",
      cardsTitle: "Neden Anında Bakiye?",
      cardsDescription: "Açıklama",
      fallbackCards,
      fallbackSteps,
    })
  );
}

describe("SimpleProductPage", () => {
  it("uses fallback cards/steps/hero when the CMS returns nothing", async () => {
    mockCmsEmpty();
    await renderPage();

    expect(screen.getByText("Varsayılan Başlık")).toBeInTheDocument();
    expect(screen.getByText("Yedek Kart")).toBeInTheDocument();
    // PhoneStepsCarousel renders the active step's text in both a desktop and
    // a mobile layout simultaneously (CSS, not JS, hides one) — hence AllBy.
    expect(screen.getAllByText("Yedek adım").length).toBeGreaterThan(0);
  });

  it("renders no FAQ section when the CMS has no FAQ items — no hardcoded fallback here", async () => {
    mockCmsEmpty();
    await renderPage();

    // Faq renders nothing for an empty list; asserting the page still rendered its other sections confirms no crash.
    expect(screen.getByText("Neden Anında Bakiye?")).toBeInTheDocument();
  });

  it("prefers CMS-provided cards, steps and hero over the page's hardcoded fallback", async () => {
    mockCmsEmpty();
    vi.mocked(getProductHero).mockResolvedValue({
      image: { url: "/cms-hero.jpg", alt: "CMS Hero" },
      heading: "CMS Başlığı",
    } as never);
    vi.mocked(getFeatureCards).mockResolvedValue([
      { icon: { url: "/cms-icon.svg" }, title: "CMS Kart", text: "CMS metin" },
    ] as never);
    vi.mocked(getStepCards).mockResolvedValue([
      { number: "01", text: "CMS adım", image: { url: "/cms-step.jpg" } },
    ] as never);

    await renderPage();

    expect(screen.getByText("CMS Başlığı")).toBeInTheDocument();
    expect(screen.getByText("CMS Kart")).toBeInTheDocument();
    expect(screen.getAllByText("CMS adım").length).toBeGreaterThan(0);
    expect(screen.queryByText("Yedek Kart")).not.toBeInTheDocument();
  });

  it("renders FAQ items from the CMS when present", async () => {
    mockCmsEmpty();
    vi.mocked(getFaqItems).mockResolvedValue([{ question: "Soru?", answer: "Cevap" }] as never);

    await renderPage();

    expect(screen.getByText("Soru?")).toBeInTheDocument();
  });
});
