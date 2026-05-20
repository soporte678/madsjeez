import type { Metadata } from "next"
import { Outfit, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/ChatContext"
import ThemeToneInit from "@/components/theme/ThemeToneInit"
import TrafficTracker from "@/components/TrafficTracker"
import { SiteJsonLd } from "@/components/seo/SiteJsonLd"
import { DeferredAnalytics } from "@/components/seo/DeferredAnalytics"
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
    default: "MadsJeez | Marketplace en Argentina - Compra y vende online",
    template: "%s | MadsJeez Marketplace",
  },
  description:
    "MadsJeez es un marketplace en Argentina para comprar y vender online: publica productos, cobra con Mercado Pago, envios y panel para vendedores.",
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
  ],
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://www.madsjeez.com.ar",
    siteName: "MadsJeez Marketplace",
    title: "MadsJeez | Marketplace en Argentina - Compra y vende online",
    description:
      "Marketplace argentino para comprar y vender online. Publica productos, gestiona ventas y hace crecer tu negocio.",
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
    <html lang="es" className={`${outfit.variable} ${montserrat.variable} antialiased`}>
      <body className="min-h-full flex flex-col font-outfit">
        <SiteJsonLd />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <ThemeToneInit />
        <DeferredAnalytics />
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
