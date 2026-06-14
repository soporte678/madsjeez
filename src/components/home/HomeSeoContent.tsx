"use client";

import Link from "next/link";

/**
 * Bloque editorial en servidor para reforzar texto indexable en la home
 * (auditorías SEO: volumen de contenido + contexto semántico del marketplace).
 */
export function HomeSeoContent() {
  return (
    <section
      className="max-w-[1184px] mx-auto px-4 pb-16"
      aria-labelledby="home-seo-guide-heading"
    >
      <article className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-700/70 dark:bg-slate-900">
        <div className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a56db] mb-2 dark:text-[#60a5fa]">
            Guía del marketplace
          </p>
          <h2
            id="home-seo-guide-heading"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4 dark:text-white"
          >
            Cómo comprar y vender en Madsjeez
          </h2>
          <p className="text-slate-600 text-[15px] md:text-base leading-relaxed max-w-3xl dark:text-slate-300">
            Madsjeez es un marketplace argentino donde encontrás productos de vendedores de todo el
            país, con búsqueda por categoría, ofertas activas y pagos con los medios disponibles según
            cada publicación. Esta guía resume cómo aprovechar la plataforma si comprás por primera vez
            o si querés llevar tu negocio online con herramientas profesionales.
          </p>
        </div>

        <div className="p-6 md:p-10 grid gap-10 md:grid-cols-2 text-slate-600 text-[15px] leading-relaxed dark:text-slate-300">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Comprar con confianza — ver ofertas del catálogo
            </h3>
            <p className="mb-4">
              Desde la home podés explorar{" "}
              <Link href="/search" className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline">
                todo el catálogo
              </Link>
              , filtrar por categoría o palabra clave y comparar precios entre publicaciones. Cada
              producto muestra fotos, descripción, condición de envío y reputación del vendedor. Al
              confirmar la compra, el pago se procesa con medios seguros —incluido Mercado Pago cuando
              el vendedor lo tiene habilitado— y recibís confirmación y seguimiento del pedido en tu
              cuenta.
            </p>
            <p className="mb-4">
              Si tenés dudas antes de comprar, podés consultar al vendedor desde la ficha del
              producto o revisar opiniones de otros compradores. Las{" "}
              <Link href="/offers" className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline">
                ofertas y promociones
              </Link>{" "}
              del marketplace se actualizan con campañas de vendedores y eventos estacionales, para
              que encuentres descuentos reales sin salir de la plataforma.
            </p>
            <p>
              Para compras recurrentes, guardá favoritos, seguí tiendas que te interesen y activá
              notificaciones cuando haya novedades en categorías que visitás con frecuencia.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Vender con MADSJEEZ Ads y el Commerce Group
            </h3>
            <p className="mb-4">
              Los comercios, ferreterías, tiendas de electrónica y emprendimientos pueden{" "}
              <Link
                href="/seller/register"
                className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline"
              >
                registrarse como vendedores
              </Link>{" "}
              , cargar publicaciones con varias imágenes, definir stock y precios, y conectar cobros.
              El panel incluye métricas de visitas, preguntas de compradores, gestión de envíos y
              opciones de publicidad dentro del marketplace (MADSJEEZ Ads).
            </p>
            <p className="mb-4">
              Los planes de suscripción amplían exposición en búsquedas y automatizan marketing.
              Madsjeez no cobra comisión por venta: el seller recibe el 100% del importe en su
              cuenta de Mercado Pago. Si ya vendés en redes sociales, Madsjeez te
              permite centralizar pedidos, mensajes y postventa sin depender de un solo canal.
            </p>
            <p>
              La logística integrada y los acuerdos con transportistas ayudan a cumplir plazos de
              entrega prometidos, mientras el equipo de soporte acompaña reclamos y casos excepcionales
              desde el{" "}
              <Link href="/ayuda" className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline">
                centro de ayuda
              </Link>
              .
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Categorías y rubros disponibles
            </h3>
            <p className="mb-4">
              El catálogo está organizado en categorías al estilo de los grandes marketplaces de la
              región: tecnología y computación, celulares, electrodomésticos, hogar y muebles,
              herramientas y construcción, deportes, moda, belleza, alimentos, vehículos, agro,
              instrumentos musicales, libros, servicios y muchas más. Cada categoría principal incluye
              subcategorías para afinar la búsqueda —por ejemplo, dentro de herramientas encontrás
              eléctricas, de mano y de medición; en deportes, fútbol, fitness, camping y running.
            </p>
            <p className="mb-4">
              Los carruseles de la página de inicio rotan productos destacados de todo el catálogo y
              de rubros específicos, para que descubras novedades aunque no tengas un producto
              concreto en mente. Las tiendas locales y marcas nacionales conviven con importadores y
              revendedores, lo que amplía la variedad de precios y condiciones de entrega según tu
              zona.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Pagos, envíos y protección</h3>
            <p className="mb-4">
              Aceptamos los principales medios de pago digitales y, según el vendedor, cuotas con
              tarjeta de crédito. El importe queda registrado en la orden y podés descargar comprobantes
              desde tu historial. Los envíos gratuitos o bonificados aplican cuando la publicación o
              la campaña del vendedor lo indica; en otros casos, el costo de envío se calcula antes
              de pagar.
            </p>
            <p>
              La política de compra protegida cubre incumplimientos graves: producto no recibido,
              notablemente distinto al anunciado o problemas de garantía documentados. Ante cualquier
              inconveniente, abrí un reclamo desde la orden para que mediación y soporte revisen el
              caso con evidencia de ambas partes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Por qué elegir Madsjeez</h3>
            <p className="mb-4">
              Unimos velocidad de compra, herramientas para vendedores y publicidad dentro del sitio
              en una sola experiencia pensada para Argentina. No somos un clon de otro marketplace:
              trabajamos identidad propia, rotación de ofertas reales, integración con Mercado Libre
              para vendedores que quieran sincronizar stock, y espacios patrocinados visibles para
              marcas que invierten en visibilidad.
            </p>
            <p>
              Si buscás un producto puntual, empezá por la barra de búsqueda. Si querés inspirarte,
              recorré categorías y ofertas. Si tenés un negocio,{" "}
              <Link
                href="/vender"
                className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline"
              >
                conocé cómo vender en Madsjeez
              </Link>{" "}
              y escalá con planes Pro cuando tu volumen lo justifique.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
