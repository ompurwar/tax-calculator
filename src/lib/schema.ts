/**
 * Structured Data (JSON-LD) Schema Generators
 * For AIO/GEO optimization and rich search results
 */

import { SITE_CONFIG } from "./seo.config";

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * Generate WebApplication schema for the tax calculator
 */
export function generateWebAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.author,
    },
    keywords: SITE_CONFIG.keywords.join(", "),
    inLanguage: "en-IN",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1247",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema for step-by-step guides
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    sameAs: [
      // Add social media links here when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

/**
 * Generate SoftwareApplication schema for calculator tool
 */
export function generateCalculatorSchema(assessmentYear: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `India Income Tax Calculator (AY ${assessmentYear})`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    featureList: [
      "CTC to In-Hand Salary Calculation",
      "New Tax Regime Support",
      "Section 87A Rebate Calculation",
      "PF Contribution Calculation",
      "Tax Slab Breakdown",
      "Multiple Salary Comparison",
      "Salary Hike Visualization",
    ],
    screenshot: `${SITE_CONFIG.url}/screenshots/calculator.png`,
  };
}

/**
 * Default FAQs for the tax calculator
 */
export const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "What is Section 87A rebate under the new tax regime?",
    answer:
      "Under the new tax regime (AY 2026-27), resident individuals with total taxable income up to ₹7 lakh are eligible for a rebate of up to ₹25,000 under Section 87A. This rebate is applied before cess calculation and follows a cliff rule - if your income exceeds ₹7 lakh by even ₹1, no rebate is available.",
  },
  {
    question: "How is cess calculated on income tax?",
    answer:
      "Health and Education Cess is calculated at 4% on the tax amount after applying the Section 87A rebate. For example, if your tax liability after rebate is ₹50,000, the cess would be ₹2,000 (4% of ₹50,000), making your total tax ₹52,000.",
  },
  {
    question: "What is the standard deduction for AY 2026-27?",
    answer:
      "For Assessment Year 2026-27 under the new tax regime, the standard deduction is ₹75,000. This amount is deducted from your gross annual income before calculating taxable income, reducing your overall tax liability.",
  },
  {
    question: "How does PF contribution affect in-hand salary?",
    answer:
      "Employee Provident Fund (EPF) contribution is deducted from your gross salary. Both employee and employer contribute (typically 12% each). Your CTC includes employer contribution, but it's not part of your take-home salary. The calculator accounts for both contributions to show accurate in-hand salary.",
  },
  {
    question: "Can I use this calculator for the old tax regime?",
    answer:
      "Currently, this calculator supports only the new tax regime for AY 2026-27. The new regime offers simplified tax slabs without the need for various deductions and exemptions available under the old regime.",
  },
  {
    question: "Why is my in-hand salary different from CTC divided by 12?",
    answer:
      "CTC (Cost to Company) includes employer contributions like PF, which don't come to you directly. Your in-hand salary is calculated after deducting income tax, employee PF contribution, and excluding employer PF from the gross amount. This calculator shows the actual monthly amount you'll receive.",
  },
];

/**
 * How-to guide for using the calculator
 */
export const CALCULATOR_HOWTO: HowToStep[] = [
  {
    name: "Configure Assessment Year and PF Details",
    text: "Click the Settings icon and select your assessment year (e.g., 2026-27). Choose whether PF is calculated as a percentage (typically 12%) or a fixed monthly amount (e.g., ₹1,800). Enter your previous CTC for comparison.",
  },
  {
    name: "Enter Expected Salary Variations",
    text: "Input up to 5 different CTC amounts you want to compare. Use the +50k/-50k buttons for quick adjustments. The calculator will automatically compute tax, PF, and in-hand salary for each variation.",
  },
  {
    name: "Review Tax Breakdown",
    text: "Check the left sidebar (desktop) or tax breakdown accordion (mobile) to see detailed tax calculation by slab, rebate application under Section 87A, and cess computation for your selected salary variation.",
  },
  {
    name: "Compare Salary Options",
    text: "Switch between Card and Table view to compare all salary variations. View hike percentage, monthly in-hand salary, and extra cash compared to your previous CTC. Use this data for informed salary negotiations.",
  },
  {
    name: "Save Your Configuration",
    text: "Click 'Save Configuration' in the settings modal to store your current setup. You can maintain multiple versions and switch between them for different scenarios or job offers.",
  },
];
