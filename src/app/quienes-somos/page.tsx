import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { COMPANY } from "@/lib/company";
import { FEATURED_SELLER, MARKETPLACE_STATS } from "@/lib/social-proof";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { ChevronRight, Target, Users } from "lucide-react";

const GALLERY = [
  { src: COMPANY.founder.photoOffice, alt: `${COMPANY.founder.name} en oficina corporativa` },
  { src: COMPANY.founder.photoLeadership, alt: `${COMPANY.founder.name} liderando el marketplace` },
  { src: COMPANY.founder.photoOperations, alt: `${COMPANY.founder.name} en operaciones` },
  { src: COMPANY.founder.photoExterior, alt: `${COMPANY.founder.name} — presencia ejecutiva` },
] as const;

export const metadata: Metadata = {
  ...canonicalMeta("/quienes-somos"),
  title: "Quiénes somos — Ezequiel Ziegler · MadsJeez Marketplace",
  description: `${COMPANY.founder.name}, ${COMPANY.founder.role} de MadsJeez: marketplace en Argentina desde ${COMPANY.address.city}.`,
  openGraph: {
    title: "Quiénes somos | MadsJeez Marketplace",
    description: COMPANY.mission,
    url: `${SITE_URL}/quienes-somos`,
    images: [{ url: `${SITE_URL}${COMPANY.founder.photoPortrait}`, width: 800, height: 800, alt: COMPANY.founder.name }],
  },
};

export default function QuienesSomosPage() {
  const { founder } = COMPANY;

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />

      <section className="relative bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={founder.photoOffice}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/50" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="relative h-48 w-48 md:h-56 md:w-56 shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <Image
              src={founder.photoPortrait}
              alt={founder.name}
              fill
              className="object-cover object-top"
              priority
              sizes="(max-width: 768px) 192px, 224px"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f97316] mb-3">
              Fundador & CEO
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-montserrat mb-4">
              {founder.name}
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              {COMPANY.tagline}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {[
            { v: MARKETPLACE_STATS.productsPublished, l: "Productos" },
            { v: MARKETPLACE_STATS.sellers, l: "Vendedores" },
            { v: MARKETPLACE_STATS.buyers, l: "Compradores" },
            { v: MARKETPLACE_STATS.ordersPerMonth, l: "Pedidos / mes" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-black text-[#3483FA]">{s.v}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-600 mt-4">
          {MARKETPLACE_STATS.shippingHighlight} · Lanzamiento {MARKETPLACE_STATS.launchYear} ·
          Tienda destacada: <strong>{FEATURED_SELLER.name}</strong>
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          <div className="space-y-8 order-2 lg:order-1">
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#3483FA]" />
                Biografía
              </h2>
              {founder.bio.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-slate-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-6 md:p-8">
              <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#f97316]" />
                Visión del proyecto
              </h2>
              {founder.vision.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-slate-700 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3">
                Datos de contacto
              </h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>
                  <strong className="text-slate-800">Razón social:</strong> {COMPANY.legalName}
                </li>
                <li>
                  <strong className="text-slate-800">CUIT:</strong> {COMPANY.cuitFormatted}
                </li>
                <li>
                  <strong className="text-slate-800">Domicilio:</strong> {COMPANY.address.full}
                </li>
                <li>
                  <strong className="text-slate-800">Email:</strong>{" "}
                  <a href={`mailto:${COMPANY.email}`} className="text-[#3483FA] hover:underline">
                    {COMPANY.email}
                  </a>
                </li>
                <li>
                  <strong className="text-slate-800">WhatsApp:</strong>{" "}
                  <a
                    href={COMPANY.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3483FA] hover:underline"
                  >
                    {COMPANY.phoneDisplay}
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/seller/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ff9100] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
              >
                Empezar a vender
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={COMPANY.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:border-[#3483FA] transition-all"
              >
                Hablar por WhatsApp
              </Link>
            </div>
          </div>

          <aside className="order-1 lg:order-2 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              El equipo detrás del marketplace
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GALLERY.map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="160px" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-3">
            El grupo
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-4">
            MadsJeez no es solo un marketplace.
          </h2>
          <p className="text-[15px] text-slate-700 leading-relaxed max-w-[68ch]">
            MadsJeez Marketplace forma parte de un grupo de productos que
            construimos desde Argentina para resolver problemas reales del
            comercio digital. Trabajamos en herramientas para vendedores de{" "}
            <a
              href="https://www.appjeezpro.com"
              target="_blank"
              rel="noopener"
              className="font-bold text-[#3483FA] hover:underline"
            >
              AppJeez Pro
            </a>{" "}
            (gestión multicuenta para sellers de MercadoLibre), una bolsa de
            empleo barrial en{" "}
            <a
              href="https://www.trabajocerca.site"
              target="_blank"
              rel="noopener"
              className="font-bold text-[#3483FA] hover:underline"
            >
              TrabajoCerca
            </a>{" "}
            y un estudio creativo en{" "}
            <a
              href="https://www.madsjeezdesign.com"
              target="_blank"
              rel="noopener"
              className="font-bold text-[#3483FA] hover:underline"
            >
              MadsJeez Design
            </a>
            . Si te interesa cómo se conecta este ecosistema con el marketplace,
            escribinos por WhatsApp.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
