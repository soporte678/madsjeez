/**
 * Dominios propios de tienda (Fase 5 — sin SSL todavía).
 * Genera token de verificación, valida el dominio y comprueba el TXT por DNS.
 * La emisión de HTTPS (Cloudflare for SaaS / proxy) es un paso de infra posterior:
 * por eso un dominio verificado queda en ssl_status = 'ssl_pending', no 'active'.
 */

import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import { prisma } from "@/lib/prisma";

/** Subdominio TXT donde el vendedor pega el token. */
export const VERIFICATION_TXT_HOST = "_madsjeez-verification";
/** Destino CNAME que se mostrará en las instrucciones. */
export const CNAME_TARGET = "domains.madsjeez.com.ar";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export function generateVerificationToken(): string {
  return `madsjeez-verify-${randomBytes(16).toString("hex")}`;
}

/** Normaliza: minúsculas, sin protocolo, sin path, sin punto final. No quita www. */
export function normalizeDomain(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export type DomainValidation = { ok: true; domain: string } | { ok: false; error: string };

export function validateCustomDomain(raw: string): DomainValidation {
  const domain = normalizeDomain(raw);
  if (!domain) return { ok: false, error: "Ingresá un dominio." };
  if (domain.length > 253) return { ok: false, error: "Dominio demasiado largo." };
  if (!DOMAIN_RE.test(domain)) return { ok: false, error: "Dominio inválido (ej: www.tunegocio.com.ar)." };
  if (domain.endsWith("madsjeez.com.ar")) return { ok: false, error: "No podés usar un dominio de Madsjeez como dominio propio." };
  return { ok: true, domain };
}

/** Comprueba el registro TXT _madsjeez-verification.<domain> = token. */
export async function checkDomainTxt(domain: string, token: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(`${VERIFICATION_TXT_HOST}.${domain}`);
    return records.flat().map((r) => r.trim()).includes(token);
  } catch {
    return false;
  }
}

/** Instrucciones DNS para mostrar en el panel. */
export function dnsInstructions(domain: string, token: string) {
  const isWww = domain.startsWith("www.");
  return {
    cname: { host: isWww ? "www" : domain.split(".")[0], target: CNAME_TARGET },
    txt: { host: VERIFICATION_TXT_HOST, value: token },
    note: isWww
      ? "Para dominio raíz, además creá un registro A/ALIAS según tu proveedor (te lo indicaremos al activar HTTPS)."
      : undefined,
  };
}

/** ¿El dominio ya lo usa otra tienda? */
export async function domainTaken(domain: string, storeId: string): Promise<boolean> {
  const row = await prisma.storeDomain.findFirst({
    where: { domain, NOT: { storeId } },
    select: { id: true },
  });
  return Boolean(row);
}
