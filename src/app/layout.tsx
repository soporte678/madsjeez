import type { Metadata } from "next"
import { Outfit, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/ChatContext"
import FloatingBots from "@/components/FloatingBots"
import ThemeToneInit from "@/components/theme/ThemeToneInit"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800", "900"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.madsjeez.com.ar"),
  title: "MadsJeez - El Nuevo Standard en Compras Globales",
  description: "Tecnología, Moda y Hogar con el respaldo del Commerce Group líder en la región. Vende y compra con la mejor plataforma.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${montserrat.variable} antialiased`}>
      <head>
        <style>{`
          @keyframes assemble {
            0% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1.5); opacity: 0; filter: blur(8px); }
            100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; filter: blur(0); }
          }
          
          @keyframes shine {
            0% { left: -100%; opacity: 0; }
            20% { opacity: 0.5; }
            100% { left: 100%; opacity: 0; }
          }

          .letter-piece {
            display: inline-block;
            position: relative;
            animation: assemble 1s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .group:hover .letter-piece {
            animation: assemble 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .shimmer-text::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transform: skewX(-20deg);
            animation: shine 4s infinite;
          }

          .glass-panel {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .floating-ui {
            animation: float 4s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }

          .bg-pattern {
            background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 30px 30px;
          }

          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col font-outfit">
        <ThemeToneInit />
        <ChatProvider>
          <Providers>
            {children}
            <FloatingBots />
          </Providers>
        </ChatProvider>
      </body>
    </html>
  )
}
