# Rediseño de la home — Madsjeez

Home reorientada a claridad y conversión, sin métricas/testimonios inventados. Build verificado.

## 1. Resumen de cambios
- Hero de **5 banners en carrusel con claims promocionales** ("18 cuotas", "50% off", "envío gratis 48hs", "Plan PRO gratis 6 meses") → **un hero único y honesto** con H1 visible, buscador central y 3 CTAs (Explorar / Vender / Crear tienda).
- Nuevo bloque **"¿Qué querés hacer?"** (Comprar / Vender / Crear tienda) arriba.
- **MADSJEEZ Ads movido de arriba hacia abajo**, presentado como herramienta para vendedores.
- **Planes corregidos**: antes Ultra $19.999 era **más barato** que Pro $29.999 ofreciendo más (bug). Ahora Básico $0 · Pro $29.999 · **Ultra $49.999** (coherente, Ultra > Pro) y alineado con los precios reales de suscripción.
- **Módulo de confianza exagerado** ("blindaje de nivel bancario", "monitoreo 24/7", "garantía total") → bloque honesto (operación en Argentina, contacto visible, políticas, medios de pago).
- **Testimonios** (nombres no verificables) → **"Casos de uso"** (ferretería, emprendedor IG, mayorista, repuestero), sin nombres/ciudades/resultados.
- Banner "MADS+" y claims tipo "Envíos GRATIS en TODOS tus pedidos" / "red más avanzada" → eliminados.
- Bloques "vendedores" y "compradores" claros con beneficios reales + CTA.
- FAQ nueva + schema FAQPage; ItemList de categorías.

## 2. Componentes modificados
- `src/app/page.tsx` — metadata (title/description/OG/Twitter) + Organization JSON-LD honesto.
- `src/app/HomePageClient.tsx` — **reescritura completa** de la estructura.
- `src/components/home/HomeSeoContent.tsx` — ablandado overclaim "miles de vendedores verificados".
- **Reutilizados sin cambios:** `FoundingSellersSection`, `CategoryCarousel`, `LazyRotatingProductCarousel` (productos reales de la DB), `PaidAdBannerSlot` (Ads), `SiteCompanyFooter/Social/Network`, `Navbar`.
- **Quitados del flujo de la home** (no borrados, reutilizables): `VsMercadoLibreSection` (comparación que atacaba a ML), `HowItWorksSection`, `SellersTestimonialsSection`, `HomeSocialProof`.

## 3. Nueva estructura
Hero → ¿Qué querés hacer? (3 cards) → Sellers Fundadores → Categorías destacadas → Productos destacados (reales) → Herramientas/ferretería (real) → Para vendedores / Para compradores → Confianza → MADSJEEZ Ads → Planes → Casos de uso → Categorías (carrusel) → FAQ → SEO → Footer.

## 4. Metadata SEO
- Title: `Madsjeez | Marketplace argentino para comprar y vender online`
- Description: comprá y vendé productos online… (compradores, emprendedores, comercios, mayoristas).
- H1 único visible: **Comprá y vendé online en Madsjeez**.
- H2: ¿Qué querés hacer? · Categorías destacadas · Productos destacados · Para vendedores · Para compradores · Un marketplace con datos claros · Planes para vendedores · Casos de uso · Preguntas frecuentes.
- Canonical: `https://www.madsjeez.com.ar`. OpenGraph + Twitter card (imagen vía convención `opengraph-image`).

## 5. Schema aplicado
- `Organization` + `WebSite` con `SearchAction` (en `page.tsx`, server).
- `FAQPage` (6 preguntas) y `ItemList` de categorías (en la home).
- `Product` sigue sólo en páginas de producto reales (no se inventó).

## 6. Eventos de analytics agregados
`home_explore_products_click`, `home_start_selling_click`, `home_create_store_click`, `category_click`, `search_submit` — cableados en hero, cards, categorías y buscador.
Pendientes de cablear dentro de componentes reutilizados: `seller_founder_apply_click` (en FoundingSellersSection), `product_click` (en los carruseles), `whatsapp_click`.

## 7. Performance
- Hero estático (se eliminó el carrusel autoplay de 5 slides con `Image` pesados y dos `useEffect` de timers) → menos JS y menos layout shift.
- Visual del hero con mock CSS (sin imágenes remotas que carguen above-the-fold).
- Se mantienen `dynamic()` con skeletons para secciones pesadas y `cv-auto` (content-visibility) en carruseles.
- Mobile-first: grids 1→2→3/4 col, botones grandes (≥44px), buscador visible arriba.

## 8. Textos eliminados/reemplazados
- "Plan PRO gratis 6 meses / Solo 100 cupos / Nunca cobramos comisión" (hero) → fundadores honestos vía sección dedicada.
- "Hasta 50% off en tecnología", "Envío gratis 48hs", "18 cuotas sin interés" (banners) → eliminados.
- "Blindaje digital de nivel bancario", "monitoreo 24/7", "garantía total… lo resolvemos en el acto" → confianza honesta.
- "Únete a la red Commerce Group más avanzada" → "Planes para vendedores".
- "Envíos GRATIS en TODOS tus pedidos" (MADS+) → eliminado.
- "miles de vendedores verificados" (SEO) → "vendedores de todo el país".

## 9. Checklist mobile
- [x] H1 y subtítulo legibles en 375px.
- [x] Buscador visible y usable arriba.
- [x] CTAs grandes y apilados en mobile.
- [x] Cards 1 columna en mobile, 3/4 en desktop.
- [x] Sin textos kilométricos; jerarquía clara.
- [x] Tokens semánticos (dark mode safe) salvo hero/footer (dark por diseño).

## 10. Próximos pasos
1. Cablear `seller_founder_apply_click` y `product_click` dentro de `FoundingSellersSection` y los carruseles.
2. Definir OG image de marca dedicada (hoy usa la global `opengraph-image`).
3. Conectar categorías a `/category/[slug]` reales (hoy van a `/search?q=` por seguridad de links).
4. A/B test del hero (H1/CTA) — ya medible con los eventos.
5. Revisar `/subscriptions` para que los precios coincidan exactamente con Básico/Pro/Ultra de la home.
