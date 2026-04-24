import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MADSJEEZ - El marketplace de Argentina",
  description: "Compra y vende productos nuevos y usados en MADSJEEZ. El marketplace más grande de Argentina con envíos a todo el país.",
  keywords: ["marketplace", "comprar", "vender", "Argentina", "ecommerce", "MADSJEEZ"],
  openGraph: {
    title: "MADSJEEZ - El marketplace de Argentina",
    description: "Compra y vende productos nuevos y usados en MADSJEEZ.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#EBEBEB]">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
