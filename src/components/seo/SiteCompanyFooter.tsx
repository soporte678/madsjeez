import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/lib/company";

export function SiteCompanyFooter() {
  return (
    <div className="space-y-4">
      <h5 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-2">
        Empresa
      </h5>
      <ul className="flex flex-col gap-2.5 text-[13px] font-medium text-slate-400">
        <li className="flex items-start gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-[#00b4d8] mt-0.5" aria-hidden />
          <span>{COMPANY.address.full}</span>
        </li>
        <li>
          <span className="text-slate-500">CUIT:</span> {COMPANY.cuitFormatted}
        </li>
        <li className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-[#00b4d8]" aria-hidden />
          <a
            href={COMPANY.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00b4d8] transition-colors"
          >
            WhatsApp {COMPANY.phoneDisplay}
          </a>
        </li>
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[#00b4d8]" aria-hidden />
          <a
            href={`mailto:${COMPANY.email}`}
            className="hover:text-[#00b4d8] transition-colors"
          >
            {COMPANY.email}
          </a>
        </li>
        <li>
          <Link href="/quienes-somos" className="text-[#f97316] hover:text-[#ffb703] font-bold">
            Quiénes somos
          </Link>
        </li>
      </ul>
    </div>
  );
}
