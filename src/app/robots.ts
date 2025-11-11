import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo.config";

/**
 * Robots.txt Configuration
 * Allows all legitimate crawlers including AI engines
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "GPTBot", // OpenAI's GPT crawler
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User", // ChatGPT browsing
        allow: "/",
      },
      {
        userAgent: "Google-Extended", // Google's AI training crawler
        allow: "/",
      },
      {
        userAgent: "PerplexityBot", // Perplexity AI
        allow: "/",
      },
      {
        userAgent: "ClaudeBot", // Anthropic's Claude
        allow: "/",
      },
      {
        userAgent: "Applebot-Extended", // Apple's AI
        allow: "/",
      },
      {
        userAgent: "CCBot", // Common Crawl (used by AI)
        allow: "/",
      },
      {
        userAgent: "anthropic-ai", // Anthropic
        allow: "/",
      },
      {
        userAgent: "Omgilibot", // Omgili
        allow: "/",
      },
      {
        userAgent: "FacebookBot", // Meta
        allow: "/",
      },
      {
        userAgent: "Diffbot", // Diffbot
        allow: "/",
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
