"use client";

import Image from "next/image";
import { buildProductImageAlt } from "@/lib/seo/product-image-alt";

type OptimizedProductImageProps = {
  src: string;
  title: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  index?: number;
  category?: string | null;
  sellerName?: string | null;
};

/**
 * Imagen de producto vía Next/Image → WebP/AVIF en CDN de Next.
 * Alt SEO desde el título del producto.
 */
export function OptimizedProductImage({
  src,
  title,
  fill,
  width,
  height,
  sizes = "224px",
  priority = false,
  className = "object-cover",
  index,
  category,
  sellerName,
}: OptimizedProductImageProps) {
  const alt = buildProductImageAlt({ title, index, category, sellerName });

  if (!src?.trim()) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  const shared = {
    src,
    alt,
    className,
    sizes,
    priority,
    quality: 80 as const,
  };

  if (fill) {
    return <Image {...shared} fill />;
  }

  return (
    <Image
      {...shared}
      width={width ?? 224}
      height={height ?? 224}
    />
  );
}
