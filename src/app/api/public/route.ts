import { NextRequest, NextResponse } from "next/server";
import { calculateSalarySummary, generateStructuredSummary } from "@/lib/summary";
import { TaxSlabDocument } from "@/types/tax";

/**
 * Public API for Machine-Readable Summaries
 * Optimized for AIO/GEO crawlers and AI engines
 */

// Mark as dynamic route (uses search params)
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

// Sample tax slab data for AY 2026-27 (New Regime)
const DEFAULT_TAX_SLAB: TaxSlabDocument = {
  assessmentYear: "2026-27",
  regime: "new",
  standardDeduction: 75000,
  cessRate: 0.04,
  rebate: {
    amount: 25000,
    incomeThreshold: 700000,
  },
  slabs: [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.1 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const assessmentYear = searchParams.get("ay") || "2026-27";
    const regime = searchParams.get("regime") || "new";
    const pfPercentage = parseFloat(searchParams.get("pf") || "12");
    
    // Parse salary ranges (comma-separated)
    const salariesParam = searchParams.get("salaries");
    let salaries: number[];
    
    if (salariesParam) {
      salaries = salariesParam.split(",").map((s) => parseFloat(s.trim()));
    } else {
      // Default salary ranges
      salaries = [1700000, 1900000, 2100000, 2300000, 2400000];
    }

    // Calculate summaries for all salaries
    const calculations = salaries.map((ctc) =>
      calculateSalarySummary(ctc, DEFAULT_TAX_SLAB, pfPercentage)
    );

    // Generate structured summary
    const summary = generateStructuredSummary(
      calculations,
      assessmentYear,
      regime
    );

    // Add metadata for AI crawlers
    const response = {
      ...summary,
      metadata: {
        tool: "India Income Tax Calculator",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://tax-calculator.vercel.app",
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        disclaimer:
          "This is a calculator tool. Consult a tax professional for accurate tax advice.",
      },
      taxConfiguration: {
        standardDeduction: DEFAULT_TAX_SLAB.standardDeduction,
        cessRate: `${DEFAULT_TAX_SLAB.cessRate * 100}%`,
        rebate: DEFAULT_TAX_SLAB.rebate,
        regime: "New Tax Regime",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Error in public API:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

// HEAD request for crawlers
export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      "Content-Type": "application/json",
      "X-Robots-Tag": "index, follow",
    },
  });
}
