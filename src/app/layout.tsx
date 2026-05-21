import type { Metadata } from "next"
import { Outfit, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/ChatContext"
import { DeferredAnalytics } from "@/components/seo/DeferredAnalytics"
import { FloatingBotsLazy } from "@/components/FloatingBotsLazy"

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
  title: "MadsJeez - El Nuevo Standard en Compras Globales",
  description: "Tecnología, Moda y Hogar con el respaldo del Commerce Group líder en la región. Vende y compra con la mejor plataforma.",
  keywords: ["marketplace", "compras online", "Argentina", "tecnología", "moda", "hogar", "MadsJeez"],
  alternates: {
    canonical: "https://www.madsjeez.com.ar",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://www.madsjeez.com.ar",
    siteName: "MadsJeez",
    title: "MadsJeez - El Nuevo Standard en Compras Globales",
    description: "Tecnología, Moda y Hogar con el respaldo del Commerce Group líder en la región.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MadsJeez Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MadsJeez - El Nuevo Standard en Compras Globales",
    description: "Tecnología, Moda y Hogar con el respaldo del Commerce Group líder en la región.",
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${montserrat.variable} antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('madsjeez-theme-tone');document.documentElement.setAttribute('data-theme',t==='soft'||t==='dark'?t:'light')}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-outfit">
        <DeferredAnalytics />
        <ChatProvider>
          <Providers>
            {children}
            <FloatingBotsLazy />
          </Providers>
        </ChatProvider>
      </body>
    </html>
  )
}
