import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

// Matches the live vodafonepay.com.tr policy: general crawlers are welcome,
// but AI-training crawlers are blocked outright (AI assistant/search bots
// like OAI-SearchBot/PerplexityBot are deliberately NOT in this list there).
const AI_TRAINING_BOTS = ["GPTBot", "CCBot", "Google-Extended", "Applebot-Extended", "meta-externalagent", "ClaudeBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: ["/api/"] },
      ...AI_TRAINING_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
