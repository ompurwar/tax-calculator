/**
 * SEO Configuration
 * Default SEO metadata for the entire application
 */

export const SITE_CONFIG = {
  name: "Tax Negotiation Tool",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://tax-calculator.vercel.app",
  description: "Compare CTCs, visualize taxes, and calculate in-hand salary under India's new tax regime. Includes PF, cess, and rebate logic for accurate salary negotiations.",
  author: "Tax Calculator Team",
  keywords: [
    "India tax calculator",
    "CTC to in-hand salary",
    "salary negotiation India",
    "income tax calculator 2026-27",
    "new tax regime",
    "Section 87A rebate",
    "PF calculator",
    "salary comparison tool",
    "take-home salary calculator",
    "Indian income tax",
  ],
};

export const SEO_DEFAULTS = {
  titleTemplate: "%s | Salary Negotiation Calculator India",
  defaultTitle: "CTC to In-Hand Salary Calculator (AY 2026-27) | India Tax Tool",
  description: SITE_CONFIG.description,
  canonical: SITE_CONFIG.url,
  openGraph: {
    type: "website" as const,
    locale: "en_IN",
    url: SITE_CONFIG.url,
    site_name: SITE_CONFIG.name,
    title: "CTC to In-Hand Salary Calculator (AY 2026-27)",
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "India Tax Calculator - CTC to In-Hand Salary Tool",
      },
    ],
  },
  twitter: {
    handle: "@taxcalculator",
    site: "@taxcalculator",
    cardType: "summary_large_image" as const,
  },
  additionalMetaTags: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      name: "keywords",
      content: SITE_CONFIG.keywords.join(", "),
    },
    {
      name: "author",
      content: SITE_CONFIG.author,
    },
    {
      name: "theme-color",
      content: "#0b0f19",
    },
    {
      property: "og:locale",
      content: "en_IN",
    },
  ],
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/apple-touch-icon.png",
      sizes: "180x180",
    },
    {
      rel: "manifest",
      href: "/site.webmanifest",
    },
  ],
};

/**
 * Generate page-specific SEO configuration
 */
export function generatePageSEO(
  title: string,
  description: string,
  path: string = "",
  ogImage?: string
) {
  const url = `${SITE_CONFIG.url}${path}`;
  
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      ...SEO_DEFAULTS.openGraph,
      title,
      description,
      url,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : SEO_DEFAULTS.openGraph.images,
    },
    twitter: {
      ...SEO_DEFAULTS.twitter,
      title,
      description,
      image: ogImage || SEO_DEFAULTS.openGraph.images[0].url,
    },
  };
}
