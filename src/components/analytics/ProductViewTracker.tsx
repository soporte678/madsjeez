"use client";

import { useEffect, useRef } from "react";
import {
  ANALYTICS_CURRENCY,
  buildAnalyticsItem,
  trackEvent,
} from "@/lib/analytics";

interface ProductViewTrackerProps {
  productId: string;
  title: string;
  price: number;
  categoryName?: string | null;
  sellerName?: string | null;
}

export function ProductViewTracker({
  productId,
  title,
  price,
  categoryName,
  sellerName,
}: ProductViewTrackerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

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
  }, [categoryName, price, productId, sellerName, title]);

  return null;
}
