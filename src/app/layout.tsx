import type { Metadata } from "next"
import { Outfit, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/ChatContext"
import ThemeToneInit from "@/components/theme/ThemeToneInit"
import TrafficTracker from "@/components/TrafficTracker"
import { SiteJsonLd } from "@/components/seo/SiteJsonLd"
import { DeferredAnalytics } from "@/components/seo/DeferredAnalytics"
import { MetaPixel } from "@/components/seo/MetaPixel"
import ClientFloatingBots from "@/components/ClientFloatingBots"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.madsjeez.com.ar"),
  title: {
    default:
      "MadsJeez | Marketplace Argentina — productos, catálogo, ofertas y MADSJEEZ Ads",
    template: "%s | MadsJeez Marketplace",
  },
  description:
    "Marketplace en Argentina para comprar y vender online: explorá el catálogo por categorías, ver ofertas activas, MADSJEEZ Ads, pagos con Mercado Pago y panel para vendedores del Commerce Group.",
  applicationName: "MadsJeez Marketplace",
  keywords: [
    "marketplace",
    "marketplace argentina",
    "marketplace para vender",
    "comprar online argentina",
    "vender online argentina",
    "ecommerce argentina",
    "publicar productos",
    "madsjeez",
    "catálogo productos",
    "ver ofertas",
    "madsjeez ads",
    "commerce group",
  ],
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://www.madsjeez.com.ar",
    siteName: "MadsJeez Marketplace",
    title:
      "MadsJeez | Marketplace Argentina — productos, catálogo, ofertas y MADSJEEZ Ads",
    description:
      "Comprá y vendé en el marketplace argentino MadsJeez: catálogo, ofertas, campañas activas y herramientas para vendedores con Mercado Pago.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MadsJeez - Marketplace en Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MadsJeez | Marketplace en Argentina - Compra y vende online",
    description:
      "Marketplace argentino para comprar y vender online. Publica productos y gestiona tus ventas.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gtmId = "GTM-PT9H3H6K"

  return (
    <html lang="es-AR" className={`${outfit.variable} ${montserrat.variable} antialiased`}>
      <body className="min-h-full flex flex-col font-outfit">
        <SiteJsonLd />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            className="gtm-noscript-frame"
            title="Google Tag Manager"
          />
        </noscript>
        <ThemeToneInit />
        <DeferredAnalytics />
        <MetaPixel />
        <ChatProvider>
          <Providers>
            <TrafficTracker />
            {children}
            <ClientFloatingBots />
          </Providers>
        </ChatProvider>
      </body>
    </html>
  )
}
