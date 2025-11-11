"use client";

/**
 * Structured Data Component
 * Injects JSON-LD schema into the page for SEO and AIO/GEO optimization
 */

import Script from "next/script";

interface StructuredDataProps {
  data: object | object[];
}

export default function StructuredData({ data }: StructuredDataProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
