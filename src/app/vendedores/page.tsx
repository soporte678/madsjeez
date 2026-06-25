"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Static metadata (exported from a Server Component wrapper below) ────────
// This file is "use client" so metadata lives in the layout or a parent RSC.
// We expose it as a named export so the RSC wrapper in layout can pick it up.
// In practice Next.js 15 App Router allows a sibling layout.tsx to carry meta.

const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Tucumán",
  "Entre Ríos",
  "Salta",
  "Misiones",
  "Chaco",
  "Corrientes",
  "Santiago del Estero",
  "San Juan",
  "Jujuy",
  "Río Negro",
  "Neuquén",
  "Formosa",
  "San Luis",
  "Catamarca",
  "La Pampa",
  "Chubut",
  "La Rioja",
  "Santa Cruz",
  "Tierra del Fuego",
];

const RUBROS = [
  "Ferretería y herramientas",
  "Repuestos",
  "Hogar y jardín",
  "Indumentaria",
  "Tecnología",
  "Bazar",
  "Accesorios",
  "Alimentos",
  "Juguetería",
  "Cosmética",
  "Mascotas",
  "Librería",
  "Otro",
];

const CANTIDADES = [
  "Menos de 50",
  "50 a 200",
  "201 a 500",
  "Más de 500",
];

const BENEFICIOS = [
  {
    icon: "📦",
    titulo: "200 publicaciones cargadas gratis",
    desc: "Carga inicial sin costo para los primeros 1000 vendedores aprobados.",
  },
  {
    icon: "💰",
    titulo: "Sin costo inicial",
    desc: "No pagás para sumar tu tienda. La carga de publicaciones es gratis.",
  },
  {
    icon: "🖥️",
    titulo: "Nueva vidriera digital",
    desc: "Mostrá tus productos a nuevos clientes que buscan en Madsjeez.",
  },
  {
    icon: "🔄",
    titulo: "Seguís donde estás",
    desc: "Ideal si ya vendés en Mercado Libre, Tienda Nube, redes o local. Sumás un canal, no abandonás.",
  },
  {
    icon: "📈",
    titulo: "Más presencia online",
    desc: "Más lugares donde tus productos aparecen = más chances de venta.",
  },
  {
    icon: "🤝",
    titulo: "Acompañamiento inicial",
    desc: "Nuestro equipo te ayuda con la carga de publicaciones.",
  },
  {
    icon: "🇦🇷",
    titulo: "Marketplace argentino",
    desc: "Plataforma pensada para comercios y vendedores de Argentina.",
  },
];

const PARA_QUIEN = [
  "Vendedores de Mercado Libre",
  "Comercios físicos (ferreterías, bazares, etc.)",
  "Emprendedores",
  "Mayoristas y distribuidores",
  "Revendedores",
  "Tiendas online",
  "Vendedores de Instagram y Facebook",
  "Ferreterías, hogar, repuestos, tecnología, indumentaria, herramientas",
];

const PASOS = [
  { n: "1", texto: "Completás el formulario con los datos de tu negocio." },
  { n: "2", texto: "Revisamos tu información y el rubro de productos." },
  { n: "3", texto: "Nos enviás la info de tus productos o el link de tu tienda actual." },
  { n: "4", texto: "Cargamos hasta 200 publicaciones gratis en Madsjeez." },
];

const CONFIANZA = [
  {
    icon: "🔗",
    texto: "No necesitás dejar de vender en otras plataformas. Madsjeez funciona como un canal adicional.",
  },
  {
    icon: "➕",
    texto: "Madsjeez no reemplaza lo que ya usás. Viene a darte otra vidriera digital para tus productos.",
  },
  {
    icon: "🎁",
    texto: "La carga inicial gratis está pensada para facilitar el ingreso de nuevos vendedores al marketplace.",
  },
];

const FAQS = [
  {
    q: "¿Tiene costo sumarme como vendedor?",
    a: "La carga inicial de hasta 200 publicaciones será gratis para los primeros 1000 vendedores aprobados.",
  },
  {
    q: "¿Tengo que dejar de vender en Mercado Libre?",
    a: "No. Madsjeez está pensado como un canal adicional de venta. Podés seguir vendiendo en Mercado Libre, Tienda Nube, redes sociales o tu local.",
  },
  {
    q: "¿Qué necesito para que carguen mis productos?",
    a: "Necesitamos tus datos, rubro, información del comercio y, si ya tenés tienda en Mercado Libre o Tienda Nube, podés enviarnos el link para facilitar la carga.",
  },
  {
    q: "¿Me garantizan ventas?",
    a: "No se garantizan ventas. Madsjeez te ofrece una nueva vidriera digital para mostrar tus productos y sumar presencia online.",
  },
  {
    q: "¿Qué pasa después de completar el formulario?",
    a: "El equipo de Madsjeez revisa la solicitud y se comunica con vos para coordinar la carga inicial.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// ─── Label component ──────────────────────────────────────────────────────────
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-300 mb-1.5">
      {children}
    </label>
  );
}

function InputField({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  ...rest
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  [key: string]: unknown;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
      {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
  required = true,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
        aria-expanded={open}
      >
        {q}
        <span
          className="shrink-0 text-orange-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-6 text-gray-600">{a}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendedoresPage() {
  // Form state
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [nombreComercio, setNombreComercio] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [direccion, setDireccion] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [rubro, setRubro] = useState("");
  const [cuit, setCuit] = useState("");
  const [cantidadProductos, setCantidadProductos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [linkMercadoLibre, setLinkMercadoLibre] = useState("");
  const [linkTiendaNube, setLinkTiendaNube] = useState("");
  const [linkInstagram, setLinkInstagram] = useState("");
  const [linkWeb, setLinkWeb] = useState("");
  const [aceptaContacto, setAceptaContacto] = useState(false);
  const [confirmaDatos, setConfirmaDatos] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!aceptaContacto || !confirmaDatos) {
      setError("Debés marcar ambos checkboxes para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vendedores/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto,
          nombreComercio,
          email,
          whatsapp,
          direccion,
          codigoPostal,
          provincia,
          localidad,
          rubro,
          cuit,
          cantidadProductos,
          linkMercadoLibre: linkMercadoLibre || null,
          linkTiendaNube: linkTiendaNube || null,
          linkInstagram: linkInstagram || null,
          linkWeb: linkWeb || null,
          mensaje: mensaje || null,
          aceptaContacto,
          confirmaDatos,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError("Ya recibimos una solicitud con ese email o CUIT.");
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Hubo un error al enviar la solicitud. Intentá de nuevo.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("No pudimos conectarnos. Revisá tu conexión a internet e intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="bg-white text-gray-900">
        {/* ── 1. TOP BANNER ── */}
        <div className="sticky top-0 z-50 bg-orange-700 text-white text-center text-sm font-semibold py-2 px-4">
          ⚡ Cupos limitados: primeros 1000 vendedores — 200 publicaciones gratis
        </div>

        {/* ── 2. HERO ── */}
        <section className="bg-gray-950 text-white px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
              🛒 Marketplace argentino · Inscripción abierta
            </div>

            {/* H1 */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Estamos sumando{" "}
              <span className="text-orange-500">1000 vendedores</span>{" "}
              a Madsjeez
            </h1>

            {/* Subtítulo */}
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-4 leading-7">
              Te cargamos hasta{" "}
              <strong className="text-white">200 publicaciones gratis</strong>{" "}
              para que empieces a vender en nuestro marketplace sin costo inicial.
            </p>

            {/* Párrafo */}
            <p className="text-base text-gray-400 max-w-2xl mx-auto mb-10 leading-7">
              Madsjeez es un marketplace argentino pensado para comercios, emprendedores y vendedores online que quieren tener más visibilidad, más canales de venta y una nueva vidriera digital para sus productos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <a
                href="#formulario"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl text-base transition-all duration-200 active:scale-[0.98]"
              >
                Quiero cargar mis 200 publicaciones gratis
              </a>
              <a
                href="#formulario"
                className="inline-block border border-white/30 hover:border-white/60 text-white font-semibold py-4 px-8 rounded-xl text-base transition-all duration-200"
              >
                Quiero sumarme como vendedor
              </a>
            </div>

            {/* Badges de confianza */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <span className="inline-flex items-center gap-2 text-sm text-gray-300">
                <span className="text-orange-500 font-bold">✓</span>
                Cupos limitados: primeros 1000 vendedores
              </span>
              <span className="hidden sm:inline text-gray-600">·</span>
              <span className="inline-flex items-center gap-2 text-sm text-gray-300">
                <span className="text-orange-500 font-bold">✓</span>
                Carga inicial gratis de hasta 200 publicaciones
              </span>
            </div>

            {/* Frase de confianza */}
            <p className="text-sm text-gray-500 italic">
              No necesitás dejar Mercado Libre, Tienda Nube, redes ni tu local.
            </p>
          </div>
        </section>

        {/* ── 3. BENEFICIOS ── */}
        <section className="bg-gray-50 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ¿Por qué sumar Madsjeez como canal de venta?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {BENEFICIOS.map((b) => (
                <div
                  key={b.titulo}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <h3 className="font-bold text-sm text-gray-900 leading-snug">{b.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. ¿PARA QUIÉN ES? ── */}
        <section className="bg-gray-900 text-white px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold">¿Para quién es Madsjeez?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARA_QUIEN.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-gray-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. CÓMO FUNCIONA ── */}
        <section className="bg-white px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cuatro pasos para empezar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PASOS.map((p) => (
                <div key={p.n} className="relative flex flex-col gap-4 bg-gray-50 rounded-2xl border border-gray-100 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white text-lg font-black shrink-0">
                    {p.n}
                  </span>
                  <p className="text-sm text-gray-700 leading-6">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. SECCIÓN CONFIANZA ── */}
        <section className="bg-gray-50 px-4 py-14 md:py-16">
          <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONFIANZA.map((c) => (
              <div key={c.icon} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
                <span className="text-2xl">{c.icon}</span>
                <p className="text-sm text-gray-700 leading-6">{c.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. URGENCIA ── */}
        <section className="bg-orange-500 px-4 py-16 md:py-20 text-white text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Cupos limitados</h2>
            <p className="text-orange-100 text-base mb-4 max-w-xl mx-auto">
              Esta acción está disponible para los primeros{" "}
              <strong>1000 vendedores</strong> registrados y aprobados.
            </p>
            <p className="text-orange-200 text-sm mb-8 max-w-lg mx-auto">
              Una vez completado el cupo inicial, la carga de publicaciones podrá tener costo o condiciones diferentes.
            </p>
            <a
              href="#formulario"
              className="inline-block bg-white text-orange-600 hover:bg-orange-50 font-bold py-4 px-10 rounded-xl text-base transition-all duration-200 active:scale-[0.98] shadow-lg"
            >
              Reservá tu cupo ahora
            </a>
          </div>
        </section>

        {/* ── 8. FORMULARIO ── */}
        <section
          id="formulario"
          className="bg-gray-950 text-white px-4 py-16 md:py-20"
        >
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Solicitar carga gratis de 200 publicaciones
              </h2>
              <p className="text-gray-400 text-sm">
                Completá tus datos y el equipo de Madsjeez se comunica con vos.
              </p>
            </div>

            {submitted ? (
              /* ── SUCCESS STATE ── */
              <div className="bg-emerald-900/40 border border-emerald-500/40 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-emerald-400 mb-3">Solicitud recibida</h3>
                <p className="text-gray-300 text-sm leading-6 mb-2">
                  El equipo de Madsjeez revisará tus datos y se comunicará con vos para avanzar con la carga inicial de tus publicaciones.
                </p>
                <p className="text-gray-500 text-xs">Revisamos las solicitudes en 1 a 3 días hábiles.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {/* ── Datos obligatorios ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombreCompleto">Nombre completo *</Label>
                    <InputField
                      id="nombreCompleto"
                      value={nombreCompleto}
                      onChange={setNombreCompleto}
                      placeholder="Ej: Juan García"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombreComercio">Nombre del comercio o marca *</Label>
                    <InputField
                      id="nombreComercio"
                      value={nombreComercio}
                      onChange={setNombreComercio}
                      placeholder="Ej: Ferretería El Tornillo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <InputField
                      id="email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp / Teléfono *</Label>
                    <InputField
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={setWhatsapp}
                      placeholder="Ej: 1121816064"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección *</Label>
                  <InputField
                    id="direccion"
                    value={direccion}
                    onChange={setDireccion}
                    placeholder="Ej: Av. Corrientes 1234"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="codigoPostal">Código postal *</Label>
                    <InputField
                      id="codigoPostal"
                      value={codigoPostal}
                      onChange={setCodigoPostal}
                      placeholder="1000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="localidad">Localidad *</Label>
                    <InputField
                      id="localidad"
                      value={localidad}
                      onChange={setLocalidad}
                      placeholder="Ej: Buenos Aires"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="provincia">Provincia *</Label>
                  <SelectField
                    id="provincia"
                    value={provincia}
                    onChange={setProvincia}
                    options={PROVINCIAS}
                    placeholder="Seleccioná tu provincia"
                  />
                </div>

                <div>
                  <Label htmlFor="rubro">Rubro *</Label>
                  <SelectField
                    id="rubro"
                    value={rubro}
                    onChange={setRubro}
                    options={RUBROS}
                    placeholder="Seleccioná el rubro"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cuit">CUIT *</Label>
                    <InputField
                      id="cuit"
                      value={cuit}
                      onChange={setCuit}
                      placeholder="XX-XXXXXXXX-X"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cantidadProductos">Cantidad aproximada de productos *</Label>
                    <SelectField
                      id="cantidadProductos"
                      value={cantidadProductos}
                      onChange={setCantidadProductos}
                      options={CANTIDADES}
                      placeholder="Seleccioná una opción"
                    />
                  </div>
                </div>

                {/* ── Datos opcionales ── */}
                <div className="border-t border-gray-800 pt-5 mt-1">
                  <p className="text-sm font-semibold text-gray-400 mb-4">
                    Datos adicionales opcionales
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkMercadoLibre">Link Mercado Libre</Label>
                      <InputField
                        id="linkMercadoLibre"
                        type="url"
                        value={linkMercadoLibre}
                        onChange={setLinkMercadoLibre}
                        placeholder="https://listado.mercadolibre.com.ar/..."
                        required={false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkTiendaNube">Link Tienda Nube</Label>
                      <InputField
                        id="linkTiendaNube"
                        type="url"
                        value={linkTiendaNube}
                        onChange={setLinkTiendaNube}
                        placeholder="https://tutienda.mitiendanube.com"
                        required={false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkInstagram">Link Instagram</Label>
                      <InputField
                        id="linkInstagram"
                        type="url"
                        value={linkInstagram}
                        onChange={setLinkInstagram}
                        placeholder="https://www.instagram.com/..."
                        required={false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkWeb">Página web propia</Label>
                      <InputField
                        id="linkWeb"
                        type="url"
                        value={linkWeb}
                        onChange={setLinkWeb}
                        placeholder="https://tutienda.com.ar"
                        required={false}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Mensaje ── */}
                <div>
                  <Label htmlFor="mensaje">Mensaje adicional / comentarios (opcional)</Label>
                  <textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="¿Hay algo más que quieras contarnos sobre tu negocio?"
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* ── Checkboxes ── */}
                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={aceptaContacto}
                      onChange={(e) => setAceptaContacto(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Acepto que Madsjeez me contacte por email o WhatsApp para continuar el proceso de alta como vendedor.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmaDatos}
                      onChange={(e) => setConfirmaDatos(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Confirmo que la información enviada es correcta y que represento al comercio indicado.
                    </span>
                  </label>
                </div>

                {/* Texto legal */}
                <p className="text-xs text-gray-600 leading-5">
                  Tus datos serán utilizados únicamente para evaluar tu incorporación como vendedor a Madsjeez y contactarte sobre el proceso de carga inicial de publicaciones.
                </p>

                {/* Error */}
                {error && (
                  <div className="bg-red-950/60 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    "Solicitar carga gratis de 200 publicaciones"
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── 9. FAQ ── */}
        <section className="bg-white px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
              Preguntas frecuentes
            </h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. FOOTER ── */}
        <footer className="bg-gray-50 border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-500">
          © Madsjeez · Marketplace argentino ·{" "}
          <Link href="/" className="text-orange-500 hover:text-orange-600 transition-colors">
            www.madsjeez.com.ar
          </Link>
        </footer>
      </main>
    </>
  );
}
