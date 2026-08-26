import { describe, expect, it } from "vitest";
import AnindaBakiye from "@/app/aninda-bakiye/page";

/**
 * The page just wires its own fallback content into <SimpleProductPage/> as
 * JSX (not awaited) — SimpleProductPage is itself an async Server Component,
 * which react-dom's client renderer (RTL) can't resolve when nested this way
 * (only Next's RSC runtime can). SimpleProductPage's actual rendering is
 * already covered by SimpleProductPage.test.tsx; this only has to prove the
 * page wires the right props into it.
 */
describe("AnindaBakiye", () => {
  it("wires pageKey and its own fallback content into SimpleProductPage", async () => {
    const element = await AnindaBakiye();
    expect(element.props.pageKey).toBe("aninda-bakiye");
    expect(element.props.breadcrumbLabel).toBe("Anında Bakiye");
    expect(element.props.fallbackCards.length).toBeGreaterThan(0);
    expect(element.props.fallbackSteps.length).toBeGreaterThan(0);
  });
});
