import type { Metadata, Viewport } from "next"
import dynamic from "next/dynamic"
import { Outfit, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/ChatContext"
import { DeferredAnalytics } from "@/components/seo/DeferredAnalytics"
import { FloatingBotsLazy } from "@/components/FloatingBotsLazy"
import { PWAProvider } from "@/components/pwa/PWAProvider"

const JarvisChatWidget = dynamic(
  () => import("@/components/jarvis").then((m) => m.JarvisChatWidget),
  { ssr: false, loading: () => null }
)

const JarvisInitializer = dynamic(
  () => import("@/components/jarvis").then((m) => m.JarvisInitializer),
  { ssr: false, loading: () => null }
)

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.madsjeez.com.ar"),
  title: "MadsJeez - Maquinaria, Herramientas y Repuestos | Argentina",
  description: "Compra y vende maquinaria industrial, herramientas profesionales y repuestos. Stock real, envios a todo el pais. El marketplace de la construccion y la industria.",
  keywords: ["marketplace", "compras online", "Argentina", "maquinaria", "herramientas", "repuestos", "construccion", "industria", "ferreteria", "MadsJeez"],
  alternates: {
    canonical: "https://www.madsjeez.com.ar",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://www.madsjeez.com.ar",
    siteName: "MadsJeez",
    title: "MadsJeez - Maquinaria, Herramientas y Repuestos | Argentina",
    description: "Compra y vende maquinaria industrial, herramientas profesionales y repuestos. Stock real, envios a todo el pais. El marketplace de la construccion y la industria.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MadsJeez Marketplace - Maquinaria y Herramientas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MadsJeez - Maquinaria, Herramientas y Repuestos | Argentina",
    description: "Compra y vende maquinaria industrial, herramientas profesionales y repuestos. Stock real, envios a todo el pais.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    google: "m8cmW9J8wkYGstv3h_D141-XvNFsthUmNFMucxqZ3lI",
  },
  manifest: "/manifest.json",
  themeColor: "#EB5204",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Madsjeez",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#EB5204",
    "msapplication-config": "/browserconfig.xml",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#EB5204",
}

const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ZXW730DHRB"
).replace(/[^A-Z0-9-]/g, "")

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${montserrat.variable} antialiased`}>
      <head>
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.svg" color="#EB5204" />
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#EB5204" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#EB5204" media="(prefers-color-scheme: dark)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('madsjeez-theme-tone');document.documentElement.setAttribute('data-theme',t==='soft'||t==='dark'?t:'light')}catch(e){}})();`,
          }}
        />
        {GA_MEASUREMENT_ID ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col font-outfit">
        <DeferredAnalytics />
        <JarvisInitializer />
        <ChatProvider>
          <Providers>
            {children}
            <FloatingBotsLazy />
            <JarvisChatWidget />
          </Providers>
        </ChatProvider>
        <PWAProvider />
      </body>
    </html>
  )
}
