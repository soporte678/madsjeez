import Link from "next/link";
import {
  AUTHORITY_EXTERNAL_LINKS,
  getSocialProfiles,
} from "@/lib/seo/social";

export function SiteSocialFooter() {
  const social = getSocialProfiles();

  return (
    <div className="space-y-6">
      {social.length > 0 && (
        <div>
          <h5 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-4">
            Redes sociales
          </h5>
          <ul className="flex flex-col gap-2">
            {social.map((profile) => (
              <li key={profile.id}>
                <a
                  href={profile.href}
                  rel="noopener noreferrer"
                  className="text-[13px] font-bold text-slate-400 hover:text-[#00b4d8] transition-colors"
                >
                  {profile.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h5 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-4">
          Enlaces de interés
        </h5>
        <ul className="flex flex-col gap-2">
          {AUTHORITY_EXTERNAL_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-slate-400 hover:text-[#00b4d8] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed max-w-sm">
        MADSJEEZ Commerce Group — marketplace en Spegazzini, Buenos Aires, Argentina.
        Ver{" "}
        <Link href="/offers" className="text-[#00b4d8] hover:underline font-semibold">
          ofertas activas
        </Link>{" "}
        y el{" "}
        <Link href="/marketplace" className="text-[#00b4d8] hover:underline font-semibold">
          catálogo completo
        </Link>
        .
      </p>
    </div>
  );
}
