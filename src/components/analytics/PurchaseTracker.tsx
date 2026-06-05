"use client";

import { useEffect, useRef } from "react";
import {
  ANALYTICS_CURRENCY,
  buildAnalyticsItem,
  trackEvent,
} from "@/lib/analytics";
import { trackMetaEvent } from "@/components/seo/MetaPixel";

interface PurchaseTrackerProps {
  orderId: string;
  orderNumber?: string | null;
  total: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string | null;
      title: string;
      seller?: { name: string | null } | null;
    };
  }>;
}

export function PurchaseTracker({
  orderId,
  orderNumber,
  total,
  items,
}: PurchaseTrackerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current || !orderId || !items.length) return;

    const key = `ga4_purchase_${orderId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      sentRef.current = true;
      return;
    }

    sentRef.current = true;
    trackEvent("purchase", {
      currency: ANALYTICS_CURRENCY,
      transaction_id: orderNumber || orderId,
      value: Number(total || 0),
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        transaction_id: orderNumber || orderId,
        value: Number(total || 0),
        items: items.map((item) =>
          buildAnalyticsItem({
            id: item.product.id || item.id,
            name: item.product.title,
            price: item.price,
            quantity: item.quantity,
            brand: item.product.seller?.name || null,
          })
        ),
      },
    });

    // Meta Pixel — Purchase (paired with CAPI server-side via event_id for dedup)
    trackMetaEvent(
      "Purchase",
      {
        value: Number(total || 0),
        currency: ANALYTICS_CURRENCY,
        content_ids: items.map((it) => it.product.id || it.id),
        content_type: "product",
        num_items: items.reduce((sum, it) => sum + it.quantity, 0),
      },
      // Same event_id used in MP webhook CAPI fire → Meta dedupes client+server
      `purchase-${orderId}`,
    );

    if (typeof window !== "undefined") {
      sessionStorage.setItem(key, "1");
    }
  }, [items, orderId, orderNumber, total]);

  return null;
}
