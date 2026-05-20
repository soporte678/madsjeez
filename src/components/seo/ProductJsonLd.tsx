import { SITE_URL } from "@/lib/seo/site";
import { buildProductImageAlt } from "@/lib/seo/product-image-alt";

type ProductJsonLdProps = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  images: string[];
  condition: string;
  inStock: boolean;
  categoryName?: string | null;
  sellerName?: string | null;
  sku?: string | null;
  ratingValue?: number;
  reviewCount?: number;
};

export function ProductJsonLd(props: ProductJsonLdProps) {
  const currency = props.currency || "ARS";
  const url = `${SITE_URL}/product/${props.id}`;
  const imageAlts = props.images.map((src, i) => ({
    "@type": "ImageObject" as const,
    url: src.startsWith("http") ? src : `${SITE_URL}${src}`,
    caption: buildProductImageAlt({
      title: props.title,
      index: i,
      category: props.categoryName,
      sellerName: props.sellerName,
    }),
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.title,
    description: props.description.slice(0, 5000),
    image: imageAlts.length > 0 ? imageAlts : undefined,
    sku: props.sku || props.id,
    url,
    brand: {
      "@type": "Brand",
      name: "MadsJeez Marketplace",
    },
    category: props.categoryName || undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: props.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: props.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition:
        props.condition === "used"
          ? "https://schema.org/UsedCondition"
          : props.condition === "refurbished"
            ? "https://schema.org/RefurbishedCondition"
            : "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: props.sellerName || "MadsJeez Marketplace",
      },
    },
    ...(props.reviewCount && props.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: props.ratingValue || 5,
            reviewCount: props.reviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
