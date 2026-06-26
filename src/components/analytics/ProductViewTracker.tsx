"use client";

import { useEffect, useRef } from "react";
import {
  ANALYTICS_CURRENCY,
  buildAnalyticsItem,
  trackEvent,
} from "@/lib/analytics";
import { trackMetaEvent } from "@/components/seo/MetaPixel";
import { saveRecentlyViewed } from "@/lib/recently-viewed";

interface ProductViewTrackerProps {
  productId: string;
  title: string;
  price: number;
  categoryName?: string | null;
  sellerName?: string | null;
  primaryImage?: string | null;
  categorySlug?: string | null;
}

export function ProductViewTracker({
  productId,
  title,
  price,
  categoryName,
  sellerName,
  primaryImage,
  categorySlug,
}: ProductViewTrackerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    saveRecentlyViewed({
      id: productId,
      title,
      price: Number(price || 0),
      image: primaryImage || null,
      categorySlug: categorySlug || "",
    });

    trackEvent("view_item", {
      currency: ANALYTICS_CURRENCY,
      value: Number(price || 0),
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        value: Number(price || 0),
        items: [
          buildAnalyticsItem({
            id: productId,
            name: title,
            price,
            quantity: 1,
            category: categoryName,
            brand: sellerName,
          }),
        ],
      },
    });

    // Meta Pixel — ViewContent for ASC campaigns retargeting + optimization
    trackMetaEvent("ViewContent", {
      content_ids: [productId],
      content_type: "product",
      content_name: title,
      content_category: categoryName || undefined,
      value: Number(price || 0),
      currency: ANALYTICS_CURRENCY,
    });
  }, [categoryName, price, productId, sellerName, title]);

  return null;
}
