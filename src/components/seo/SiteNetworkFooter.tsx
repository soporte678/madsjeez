import { ExternalLink } from "lucide-react";

/**
 * Red de proyectos — backlinks legítimos a sitios hermanos del mismo grupo.
 *
 * Reglas SEO white-hat aplicadas:
 *  - Solo 3 sitios temáticamente relacionados (no los 7 → eso sería patrón PBN).
 *  - Anchor text descriptivo y único, no "click aquí".
 *  - rel="noopener" siempre (seguridad), sin "nofollow" — son propiedades legítimas.
 *  - Marcamos external con icono + target="_blank" para UX honesta.
 *  - El resto de sister sites (marda, mellimelos, appjeezpro.store) están en
 *    el Organization JSON-LD `sameAs` que Google usa para entidades relacionadas.
 */

type NetworkSite = {
  href: string;
  brand: string;
  tagline: string;
};

const NETWORK_SITES: NetworkSite[] = [
  {
    href: "https://www.appjeezpro.com",
    brand: "AppJeez Pro",
    tagline: "Gestión multicuenta para sellers de MercadoLibre",
  },
  {
    href: "https://www.trabajocerca.site",
    brand: "TrabajoCerca",
    tagline: "Bolsa de empleo barrial sin intermediarios",
  },
  {
    href: "https://www.madsjeezdesign.com",
    brand: "MadsJeez Design",
    tagline: "Estudio de diseño y branding del grupo",
  },
];

export function SiteNetworkFooter() {
  return (
    <div className="space-y-4">
      <h4 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-2">
        Red de proyectos
      </h4>
      <ul className="flex flex-col gap-3 text-[13px]">
        {NETWORK_SITES.map((s) => (
          <li key={s.href}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener"
              className="group inline-flex items-start gap-2 text-slate-400 hover:text-[#00b4d8] transition-colors"
            >
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0 mt-1 text-slate-600 group-hover:text-[#00b4d8]"
                aria-hidden
              />
              <span className="flex flex-col">
                <span className="font-bold text-slate-200 group-hover:text-white">
                  {s.brand}
                </span>
                <span className="text-[11.5px] text-slate-500 leading-snug">
                  {s.tagline}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SiteNetworkFooter;
