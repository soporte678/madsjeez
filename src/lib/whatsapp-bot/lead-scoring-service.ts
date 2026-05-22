import type { WhatsappLeadStatus } from "@prisma/client";

export function scoreLeadFromMessage(message: string, current: WhatsappLeadStatus): WhatsappLeadStatus {
  const lower = message.toLowerCase();
  const rank: Record<WhatsappLeadStatus, number> = {
    new: 0,
    warm: 1,
    hot: 2,
    customer: 3,
    closed: 3,
    lost: -1,
  };

  let next: WhatsappLeadStatus = current;
  if (rank[current] < 0) return current;

  if (
    /comprar|pago|link|mercado pago|transferencia|pedido|lo llevo|lo quiero|reserv|confirmo|mandame|pasame el link/.test(
      lower
    )
  ) {
    next = "hot";
  } else if (
    /precio|stock|env[ií]o|cuotas|disponible|talle|medida|garant[ií]a|cu[aá]nto sale|objecion|caro|descuento/.test(
      lower
    )
  ) {
    next = "warm";
  } else if (/hola|buen|info|consulta/.test(lower) && current === "new") {
    next = "new";
  }

  if (/gracias|listo|pagado|ya compr[eé]|recib[ií]/.test(lower) && rank[current] < rank.customer) {
    next = "customer";
  }

  if (rank[next] > rank[current]) return next;
  return current;
}

export function detectIntentSnippet(message: string): string {
  const lower = message.toLowerCase();
  if (/comprar|pago|link|reserv/.test(lower)) return "intención de compra";
  if (/caro|descuento|promo/.test(lower)) return "objeción de precio";
  if (/lo pienso|después|más tarde/.test(lower)) return "objeción de tiempo";
  if (/precio/.test(lower)) return "consulta de precio";
  if (/stock|disponible/.test(lower)) return "consulta de stock";
  if (/env[ií]o/.test(lower)) return "consulta de envío";
  if (/humano|vendedor/.test(lower)) return "pide humano";
  return message.slice(0, 120);
}
