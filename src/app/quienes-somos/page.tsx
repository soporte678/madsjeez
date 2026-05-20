import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { COMPANY } from "@/lib/company";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ChevronRight, Target, Users } from "lucide-react";

export const metadata: Metadata = {
  ...canonicalMeta("/quienes-somos"),
  title: "Quiénes somos — MadsJeez Marketplace Argentina",
  description: `Conocé a ${COMPANY.founder.name}, fundador de MadsJeez: marketplace en Argentina para comprar y vender online desde ${COMPANY.address.city}.`,
  openGraph: {
    title: "Quiénes somos | MadsJeez Marketplace",
    description: COMPANY.mission,
    url: "https://www.madsjeez.com.ar/quienes-somos",
  },
};

export default function QuienesSomosPage() {
  const { founder } = COMPANY;

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e] text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f97316] mb-4">
            E-E-A-T · Experiencia · Autoridad · Confianza
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-montserrat mb-6">
            Quiénes somos
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {COMPANY.tagline}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div
              className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-4xl font-black text-white"
              aria-hidden
            >
              EZ
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3483FA] mb-1">
              Fundador
            </p>
            <h2 className="text-xl font-black text-slate-900">{founder.name}</h2>
            <p className="text-sm font-semibold text-[#f97316] mt-1">{founder.role}</p>
            <p className="text-xs text-slate-500 mt-4">
              Foto profesional — próximamente
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#3483FA]" />
                Biografía
              </h3>
              {founder.bio.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-slate-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-6 md:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#f97316]" />
                Visión del proyecto
              </h3>
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
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-[#3483FA] hover:underline"
              >
                Centro de ayuda
              </Link>
            </div>
          </div>
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
