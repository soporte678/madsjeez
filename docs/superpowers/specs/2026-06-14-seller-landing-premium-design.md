# Rediseño premium de las landings de vendedores — Fase 1

**Fecha:** 2026-06-14 · **Estado:** implementado (flagship `/vender-en-madsjeez`)

## Contexto y decisión
El usuario pidió transformar las páginas de captación de vendedores en una experiencia premium/dinámica (3D-feel, motion) sin romper performance/SEO. Decisiones acordadas:
- **Flagship:** `/vender-en-madsjeez` (renderizado por el componente compartido `SellerLanding` → al mejorarlo, las 14 landings por rubro suben juntas).
- **3D-feel liviano:** CSS 3D transforms + Framer Motion (`motion`), sin WebGL/canvas.
- **Acento:** azul eléctrico. Hallazgo: el `--primary` del sitio ya es `#1d4ed8` (azul); no hubo que reemplazar marca.

## Arquitectura
- `SellerLanding` sigue siendo **server component** (texto del hero estático → LCP/SEO intactos). Las animaciones viven en **islas client** (`"use client"`).
- Componentes nuevos en `src/components/seller/premium/`:
  - `motion-primitives.tsx`: `Reveal` (whileInView once), `TiltCard` (tilt por puntero, solo mouse), `CountUp` (contador en viewport).
  - `SellerHeroVisual.tsx`: tarjetas de producto **reales** del catálogo (flotando + tilt) + notificación de consulta + chip de stat. `<img>` plano (evita problema de hosts de next/image con mlstatic).
  - `AnimatedPipeline.tsx`: Producto → Publicación → Visita → Compra → Envío → Cobro (stagger al scrollear).
  - `LogisticsCard.tsx`: Madsjeez Flash (Retirado → En camino → Entregado, progreso animado).
- `src/lib/seo/hero-products.ts`: fetch server de productos reales (falla a `[]` sin romper; el visual degrada solo).

## Secciones (data-driven)
Hero dark premium (split asimétrico) → tira de confianza → beneficios (Reveal + TiltCard) → cómo funciona (pipeline animada + 3 pasos) → rubros → comparativa (Reveal) → Madsjeez Flash + stats honestos → prosa SEO → formulario → FAQ → CTA final (Reveal).

## Reglas respetadas
- **Performance:** sin WebGL/video; hero text estático (LCP); motion `whileInView` once + GPU transforms; `<img>` lazy. Una sola dependencia nueva (`motion`, ~tree-shakeable).
- **prefers-reduced-motion:** todas las primitivas degradan a estático.
- **Theme lock:** un único cambio de tema (hero oscuro → cuerpo claro), patrón intencional.
- **Sin métricas inventadas** (respeta la auditoría previa): stats honestos = +700 catálogo real, 0% comisión beta, 100% del importe al vendedor.
- **Sin em-dash**, sin AI-purple, sin dashboard-fake de divs (se usan productos reales).

## Pendiente / próximas fases
- Propagar el lenguaje al home y a Madsjeez Flash standalone / registro de vendedores.
- Medir Lighthouse en producción y ajustar.
- Los productos del hero aparecen tras la primera revalidación si el build no tuvo DB (degradación elegante mientras tanto).
