/**
 * Summary Generation for AIO/GEO Optimization
 * Creates natural-language, machine-readable salary summaries
 */

import { TaxSlabDocument } from "@/types/tax";

interface SalaryCalculation {
  ctc: number;
  grossMonthly: number;
  monthlyTax: number;
  monthlyPF: number;
  inHandMonthly: number;
  annualTax: number;
  effectiveTaxRate: number;
}

/**
 * Calculate detailed salary breakdown
 */
export function calculateSalarySummary(
  ctc: number,
  taxSlabData: TaxSlabDocument,
  pfPercentage: number = 12
): SalaryCalculation {
  const { standardDeduction, cessRate, slabs } = taxSlabData;

  // Calculate PF
  const monthlyEmployerPF = (ctc * pfPercentage) / 100 / 12;
  const grossAnnual = ctc - monthlyEmployerPF * 12;
  const monthlyEmployeePF = (grossAnnual * pfPercentage) / 100 / 12;

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossAnnual - standardDeduction);

  // Calculate tax slab-by-slab
  let totalTax = 0;
  let remainingIncome = taxableIncome;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    if (slab.upTo === null || slab.upTo === Infinity) {
      totalTax += remainingIncome * slab.rate;
      break;
    }

    const slabRange = slab.upTo - previousLimit;

    if (remainingIncome > slabRange) {
      totalTax += slabRange * slab.rate;
      remainingIncome -= slabRange;
      previousLimit = slab.upTo;
    } else {
      totalTax += remainingIncome * slab.rate;
      break;
    }
  }

  // Apply rebate if applicable
  let rebateAmount = 0;
  if (taxSlabData.rebate && taxableIncome <= taxSlabData.rebate.incomeThreshold) {
    rebateAmount = Math.min(totalTax, taxSlabData.rebate.amount);
  }

  const taxAfterRebate = Math.max(0, totalTax - rebateAmount);
  const cess = taxAfterRebate * cessRate;
  const totalTaxWithCess = taxAfterRebate + cess;

  const grossMonthly = grossAnnual / 12;
  const monthlyTax = totalTaxWithCess / 12;
  const inHandMonthly = grossMonthly - monthlyTax - monthlyEmployeePF;
  const effectiveTaxRate = grossAnnual > 0 ? (totalTaxWithCess / grossAnnual) * 100 : 0;

  return {
    ctc,
    grossMonthly,
    monthlyTax,
    monthlyPF: monthlyEmployeePF,
    inHandMonthly,
    annualTax: totalTaxWithCess,
    effectiveTaxRate,
  };
}

/**
 * Generate natural-language summary for a single salary
 */
export function generateSalarySummary(calc: SalaryCalculation, assessmentYear: string): string {
  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

  return `For AY ${assessmentYear}, a CTC of ${formatCurrency(calc.ctc)} results in an in-hand monthly salary of ${formatCurrency(calc.inHandMonthly)}. This accounts for an annual tax liability of ${formatCurrency(calc.annualTax)} (effective rate: ${calc.effectiveTaxRate.toFixed(2)}%), monthly PF deduction of ${formatCurrency(calc.monthlyPF)}, and monthly tax deduction of ${formatCurrency(calc.monthlyTax)}. The gross monthly income before deductions is ${formatCurrency(calc.grossMonthly)}.`;
}

/**
 * Generate comparison summary for multiple salaries
 */
export function generateComparisonSummary(
  calculations: SalaryCalculation[],
  assessmentYear: string
): string {
  if (calculations.length === 0) return "";
  if (calculations.length === 1) {
    return generateSalarySummary(calculations[0], assessmentYear);
  }

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

  const summaries = calculations.map((calc, idx) => {
    return `Option ${idx + 1}: CTC ${formatCurrency(calc.ctc)} → In-hand ${formatCurrency(calc.inHandMonthly)}/month (Tax: ${formatCurrency(calc.annualTax)}/year, ${calc.effectiveTaxRate.toFixed(1)}% effective rate)`;
  });

  const minInHand = Math.min(...calculations.map((c) => c.inHandMonthly));
  const maxInHand = Math.max(...calculations.map((c) => c.inHandMonthly));
  const difference = maxInHand - minInHand;

  return `India Income Tax Calculator for AY ${assessmentYear} (New Regime). Comparing ${calculations.length} salary options: ${summaries.join("; ")}. The difference in monthly in-hand salary between lowest and highest options is ${formatCurrency(difference)}.`;
}

/**
 * Generate structured data for API consumption
 */
export function generateStructuredSummary(
  calculations: SalaryCalculation[],
  assessmentYear: string,
  regime: string = "new"
) {
  return {
    assessmentYear,
    regime,
    timestamp: new Date().toISOString(),
    summary: generateComparisonSummary(calculations, assessmentYear),
    calculations: calculations.map((calc) => ({
      ctc: Math.round(calc.ctc),
      grossMonthly: Math.round(calc.grossMonthly),
      monthlyTax: Math.round(calc.monthlyTax),
      monthlyPF: Math.round(calc.monthlyPF),
      inHandMonthly: Math.round(calc.inHandMonthly),
      annualTax: Math.round(calc.annualTax),
      effectiveTaxRate: parseFloat(calc.effectiveTaxRate.toFixed(2)),
    })),
  };
}

/**
 * Generate SEO-friendly description for a salary range
 */
export function generateMetaDescription(
  minCTC: number,
  maxCTC: number,
  assessmentYear: string
): string {
  const formatShort = (amount: number) => {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(1)}L`;
  };

  return `Calculate in-hand salary for CTC ranging from ${formatShort(minCTC)} to ${formatShort(maxCTC)} under India's new tax regime (AY ${assessmentYear}). Includes Section 87A rebate, 4% cess, PF deductions, and detailed tax breakdown by slab.`;
}

/**
 * Generate keyword-rich summary for search engines
 */
export function generateSearchSummary(assessmentYear: string): string {
  return `India Income Tax Calculator for Assessment Year ${assessmentYear}. Calculate CTC to in-hand salary conversion using new tax regime. Features: Section 87A rebate calculation (up to ₹25,000 for income ≤ ₹7L), standard deduction (₹75,000), 4% health and education cess, PF contribution calculator, tax slab breakdown, salary comparison tool, hike percentage calculator, and salary negotiation assistant. Supports multiple salary variations with detailed monthly and annual breakdowns.`;
}
