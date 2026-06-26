import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const alt = "Producto en MadsJeez Marketplace"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function ProductOgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      title: true,
      price: true,
      condition: true,
      freeShipping: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      category: { select: { name: true } },
    },
  })

  const title = product?.title ?? "Producto"
  const price = product?.price ? Number(product.price) : null
  const priceStr = price !== null ? `$ ${price.toLocaleString("es-AR")}` : null
  const categoryName = product?.category?.name ?? ""
  const imageUrl = product?.images?.[0]?.url ?? null
  const isNew = product?.condition !== "used"
  const freeShip = product?.freeShipping ?? false

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left: product image */}
        {imageUrl && (
          <div
            style={{
              width: 480,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              padding: 40,
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              width={400}
              height={400}
              style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
            />
          </div>
        )}

        {/* Right: product info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: imageUrl ? "52px 56px" : "52px 72px",
            gap: 0,
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f97316",
              marginBottom: 20,
            }}
          >
            MadsJeez Marketplace
          </div>

          {/* Category */}
          {categoryName && (
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {categoryName}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: imageUrl ? 38 : 52,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#f8fafc",
              marginBottom: 28,
              maxWidth: 580,
            }}
          >
            {title.length > 80 ? title.slice(0, 78) + "…" : title}
          </div>

          {/* Price */}
          {priceStr && (
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: "#4ade80",
                marginBottom: 20,
                letterSpacing: "-0.02em",
              }}
            >
              {priceStr}
            </div>
          )}

          {/* Badges */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {isNew && (
              <span
                style={{
                  background: "#1e40af",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: "6px 14px",
                }}
              >
                Nuevo
              </span>
            )}
            {freeShip && (
              <span
                style={{
                  background: "#166534",
                  color: "#bbf7d0",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: "6px 14px",
                }}
              >
                Envío gratis
              </span>
            )}
          </div>

          {/* Domain */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 32,
              fontSize: 20,
              color: "#475569",
            }}
          >
            madsjeez.com.ar
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
