/** Datos de contacto del comprador para reclamar pedidos hechos como invitado o con otro perfil. */
export type GuestClaimInput = {
  email?: string | null;
  phone?: string | null;
  document?: string | null;
};

export type GuestClaim = {
  email: string | null;
  phone: string | null;
  document: string | null;
};

export function normalizeEmail(e: string | null | undefined): string | null {
  if (!e?.trim()) return null;
  return e.trim().toLowerCase();
}

/** Solo dígitos para comparar teléfonos. */
export function normalizePhone(p: string | null | undefined): string | null {
  if (!p?.trim()) return null;
  const d = p.replace(/\D/g, "");
  return d.length ? d : null;
}

/** DNI / documento: alfanumérico sin espacios extra. */
export function normalizeDocument(d: string | null | undefined): string | null {
  if (!d?.trim()) return null;
  return d.replace(/\s+/g, "").toUpperCase();
}

export function buildGuestClaim(fallbackEmail: string | null | undefined, input: GuestClaimInput): GuestClaim {
  return {
    email: normalizeEmail(input.email ?? fallbackEmail),
    phone: normalizePhone(input.phone),
    document: normalizeDocument(input.document),
  };
}

export function readGuestClaimFromShipping(shipping: unknown): GuestClaim | null {
  if (!shipping || typeof shipping !== "object") return null;
  const o = shipping as Record<string, unknown>;
  const raw = o.guest_claim;
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  return {
    email: normalizeEmail(typeof g.email === "string" ? g.email : null),
    phone: normalizePhone(typeof g.phone === "string" ? g.phone : null),
    document: normalizeDocument(typeof g.document === "string" ? g.document : null),
  };
}

export function guestClaimMatchesProfile(
  claim: GuestClaim | null,
  profile: { email: string | null | undefined; phone?: string | null; document?: string | null }
): boolean {
  if (!claim) return false;
  const em = normalizeEmail(profile.email);
  if (claim.email && em && claim.email === em) return true;
  const ph = normalizePhone(profile.phone ?? undefined);
  if (claim.phone && ph && claim.phone === ph) return true;
  const doc = normalizeDocument(profile.document ?? undefined);
  if (claim.document && doc && claim.document === doc) return true;
  return false;
}

export function shippingWithGuestClaim(
  shipping: Record<string, unknown>,
  claim: GuestClaim
): Record<string, unknown> {
  return {
    ...shipping,
    guest_claim: claim,
  };
}
