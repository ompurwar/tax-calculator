import { Metadata } from "next";
import { generatePageSEO, SITE_CONFIG } from "@/lib/seo.config";
import { generateSearchSummary } from "@/lib/summary";

const assessmentYear = "2026-27";

export const metadata: Metadata = {
  ...generatePageSEO(
    "CTC to In-Hand Salary Calculator (AY 2026-27) | India Tax Tool",
    generateSearchSummary(assessmentYear),
    "/",
    `${SITE_CONFIG.url}/api/og?title=${encodeURIComponent("India Tax Calculator")}&ay=${assessmentYear}`
  ),
  alternates: {
    canonical: SITE_CONFIG.url,
  },
};

export default function Head() {
  return null;
}
