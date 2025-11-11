import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo.config";

/**
 * Dynamic Sitemap Generator
 * Generates XML sitemap for search engines and AI crawlers
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const currentDate = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // Common salary ranges for CTC (in lakhs)
  const salaryRanges = [
    300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1200000,
    1500000, 1800000, 2000000, 2400000, 3000000, 3600000, 4000000, 5000000,
    6000000, 8000000, 10000000, 12000000, 15000000, 20000000,
  ];

  // Generate comparison pages for common salary ranges
  const comparisonPages: MetadataRoute.Sitemap = [];
  for (let i = 0; i < salaryRanges.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 3, salaryRanges.length); j++) {
      const salaryA = salaryRanges[i];
      const salaryB = salaryRanges[j];
      comparisonPages.push({
        url: `${baseUrl}/compare/${salaryA}-vs-${salaryB}`,
        lastModified: currentDate,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Assessment year pages
  const assessmentYears = ["2025-26", "2026-27", "2027-28"];
  const yearPages: MetadataRoute.Sitemap = assessmentYears.map((year) => ({
    url: `${baseUrl}/ay/${year}`,
    lastModified: currentDate,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...yearPages, ...comparisonPages.slice(0, 50)]; // Limit to 50 comparison pages
}
