import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  it("blocks /api/ for every crawler", () => {
    const result = robots();
    expect(result.rules).toContainEqual({ userAgent: "*", disallow: ["/api/"] });
  });

  it("blocks the known AI-training bots outright — matches the live site's policy", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    for (const bot of ["GPTBot", "CCBot", "Google-Extended", "Applebot-Extended", "meta-externalagent", "ClaudeBot"]) {
      expect(rules).toContainEqual({ userAgent: bot, disallow: "/" });
    }
  });

  it("points at the sitemap under SITE_URL", () => {
    const result = robots();
    expect(result.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
