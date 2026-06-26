import Link from "next/link";
import { MapPin, Phone, Mail, Code2, Briefcase, Palette, ExternalLink } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { AUTHORITY_EXTERNAL_LINKS } from "@/lib/seo/social";

const NAV_SIMPLE = [
  {
    title: "Marketplace",
    links: [
      ["Quiénes somos", "/quienes-somos"],
      ["Centro de ayuda", "/ayuda"],
      ["Ofertas", "/offers"],
      ["Contacto", "/ayuda"],
      ["Marketplace por provincia", "/marketplace"],
      ["Comprar por ciudad", "/comprar"],
    ],
  },
  {
    title: "Vendedores",
    links: [
      ["Empezar a vender", "/seller/register"],
      ["Crear mi tienda", "/crear-tienda-online"],
      ["Ayuda para vendedores", "/ayuda-vendedores"],
      ["Suscripciones", "/subscriptions"],
    ],
  },
];

const NETWORK = [
  {
    href: "https://www.appjeezpro.com",
    brand: "AppJeez Pro",
    tagline: "Gestión multicuenta para sellers de MercadoLibre.",
    Icon: Code2,
  },
  {
    href: "https://www.trabajocerca.site",
    brand: "TrabajoCerca",
    tagline: "Bolsa de empleo barrial sin intermediarios.",
    Icon: Briefcase,
  },
  {
    href: "https://www.madsjeezdesign.com",
    brand: "MadsJeez Design",
    tagline: "Estudio de diseño y branding del grupo.",
    Icon: Palette,
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800/60 bg-[#030712] text-slate-400">
      {/* Glow superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-px w-full"
        style={{ background: "linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: "rgba(249,115,22,0.05)" }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-8 pt-20 lg:px-12">

        {/* Header del footer */}
        <div className="mb-16 border-b border-slate-800/50 pb-12">
          <h2 className="mb-4 flex items-center gap-[2px] text-3xl font-extrabold tracking-tight text-white">
            MADS<span className="text-orange-500">JEEZ</span>
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Marketplace argentino para comprar y vender online: catálogo, ofertas, MADSJEEZ Ads y herramientas
            para vendedores con Mercado Pago, Instagram, Facebook y WhatsApp.
          </p>
        </div>

        {/* Grilla 12 columnas */}
        <div className="mb-16 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-12">

          {/* Columna Empresa + Enlaces de interés — 3 cols */}
          <div className="flex flex-col gap-8 lg:col-span-3">
            <div>
              <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">Empresa</h3>
              <ul className="space-y-4 text-[13px]">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-[2px] h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                  <span className="leading-snug text-slate-300">{COMPANY.address.full}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-slate-700 font-mono text-[10px] text-slate-500">ID</span>
                  <span className="text-slate-300">CUIT: {COMPANY.cuitFormatted}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                  <a
                    href={COMPANY.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 transition-colors hover:text-orange-400"
                  >
                    WhatsApp {COMPANY.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-slate-300 transition-colors hover:text-orange-400"
                  >
                    {COMPANY.email}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">
                Enlaces de Interés
              </h3>
              <ul className="space-y-3 text-[13px]">
                {AUTHORITY_EXTERNAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                    >
                      <span className="h-px w-0 bg-orange-500 transition-all duration-300 group-hover:w-2" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Marketplace + Vendedores — 2 cols cada una */}
          {NAV_SIMPLE.map((section) => (
            <div key={section.title} className="lg:col-span-2">
              <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">
                {section.title}
              </h3>
              <ul className="space-y-3 text-[13px]">
                {section.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="block text-slate-400 transition-colors hover:text-orange-400">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Guías y Ayuda + Legales — combinadas en 2 cols */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div>
              <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">Guías y Ayuda</h3>
              <ul className="space-y-3 text-[13px]">
                {[["Guías de compra", "/guias"], ["Reparación", "/reparacion"], ["Comparativas", "/comparativas"], ["Marcas", "/marcas"], ["Blog", "/blog"], ["Tutoriales", "/tutoriales"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="block text-slate-400 transition-colors hover:text-orange-400">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">Legales</h3>
              <ul className="space-y-3 text-[13px]">
                {[["Términos", "/legal/terminos"], ["Privacidad", "/legal/privacidad"], ["Aviso Legal", "/legal/aviso-legal"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="block text-slate-400 transition-colors hover:text-orange-400">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Red de proyectos — 3 cols */}
          <div className="lg:col-span-3">
            <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">
              Red de Proyectos
            </h3>
            <div className="flex flex-col gap-3">
              {NETWORK.map(({ href, brand, tagline, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-all duration-300 hover:border-orange-500/40 hover:bg-slate-800/50"
                >
                  <div
                    aria-hidden
                    className="absolute -mr-6 -mt-6 right-0 top-0 h-20 w-20 rounded-full bg-orange-500/10 blur-xl transition-all group-hover:bg-orange-500/20"
                  />
                  <div className="relative z-10 mb-1.5 flex items-center gap-3">
                    <Icon className="h-4 w-4 text-orange-500" aria-hidden />
                    <h4 className="text-[13px] font-semibold text-slate-100 transition-colors group-hover:text-orange-400">
                      {brand}
                    </h4>
                    <ExternalLink className="ml-auto h-3 w-3 text-slate-600 transition-colors group-hover:text-orange-500" aria-hidden />
                  </div>
                  <p className="relative z-10 text-[12px] text-slate-500">{tagline}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer SEO */}
        <div className="mb-6 border-t border-slate-800/50 pt-8">
          <p className="max-w-4xl text-[12px] leading-relaxed text-slate-500">
            MADSJEEZ Commerce Group — marketplace en Spegazzini, Buenos Aires, Argentina. Ver{" "}
            <Link href="/offers" className="font-medium text-cyan-500 transition-colors hover:text-cyan-400">
              ofertas activas
            </Link>{" "}
            y el{" "}
            <Link href="/marketplace" className="font-medium text-cyan-500 transition-colors hover:text-cyan-400">
              catálogo completo
            </Link>
            .
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-6 pt-6 md:flex-row">
          <div className="text-[11px] font-medium tracking-wider text-slate-500">
            COPYRIGHT &copy; 2026 {COMPANY.legalName}
          </div>
          <Link
            href="/legal/aviso-legal"
            className="group flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-orange-500/50 hover:bg-slate-800"
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Data Fiscal
          </Link>
        </div>
      </div>
    </footer>
  );
}
