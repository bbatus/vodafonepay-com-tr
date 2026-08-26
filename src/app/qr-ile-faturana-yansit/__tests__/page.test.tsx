import { describe, expect, it } from "vitest";
import QrIleFaturanaYansit from "@/app/qr-ile-faturana-yansit/page";

/** See aninda-bakiye's page.test.tsx for why this is a shallow element check. */
describe("QrIleFaturanaYansit", () => {
  it("wires pageKey and its own fallback content into SimpleProductPage", async () => {
    const element = await QrIleFaturanaYansit();
    expect(element.props.pageKey).toBe("qr-ile-faturana-yansit");
    expect(element.props.breadcrumbLabel).toBe("Qr ile Faturana Yansıt");
    expect(element.props.fallbackCards.length).toBeGreaterThan(0);
    expect(element.props.fallbackSteps.length).toBeGreaterThan(0);
  });
});
