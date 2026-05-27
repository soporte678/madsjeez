import React from "react";

interface ProductJsonLdProps {
  product: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    currency?: string;
    brand?: string | null;
    images?: string[];
    category?: string;
    rating?: number;
    reviewCount?: number;
    availability?: "InStock" | "OutOfStock";
    url?: string;
  };
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: product.images?.[0] || "/og-image.jpg",
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    sku: product.id,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: product.url || `https://www.madsjeez.com.ar/product/${product.id}`,
      priceCurrency: product.currency || "ARS",
      price: product.price.toString(),
      availability: `https://schema.org/${product.availability || "InStock"}` as const,
      seller: {
        "@type": "Organization",
        name: "MadsJeez",
      },
    },
    aggregateRating:
      product.rating && product.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.toString(),
            reviewCount: product.reviewCount.toString(),
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default ProductJsonLd;
