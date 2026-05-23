# SEO Audit — MadsJeez Marketplace

**Site**: madsjeez.com.ar  
**Framework**: Next.js 15 (App Router)  
**Fecha**: 2026-05-23  
**Score estimado**: 68/100 → 78/100 post-fixes

---

## Resumen

El proyecto tiene buenas bases SEO en las páginas dinámicas clave (producto, categoría, tienda, seller). Los problemas están en las landing pages estáticas importantes que eran `"use client"` sin metadata exportable, en el sitemap incompleto, y en la ausencia de schema Organization/WebSite en la home.

---

## Problemas encontrados

### Alta prioridad
- `/vender` — página principal de captación de vendedores sin metadata (era `"use client"`) ✅ CORREGIDO
- `/blog` — sin metadata ni canonical ✅ CORREGIDO
- `sitemap.ts` — faltaban rutas clave: `/vender`, `/marketplace`, `/categories`, `/quienes-somos`, `/help`, `/blog`, `/seller/register`, legales restantes, y tiendas públicas `/tienda/[slug]` ✅ CORREGIDO
- `src/app/page.tsx` — sin canonical explícito ni schema Organization/WebSite ✅ CORREGIDO
- `/help/page.tsx` — sin metadata ✅ CORREGIDO
- OG image `/og-image.jpg` no existe en `/public` — el layout global la referencia pero el archivo físico falta ⚠️ PENDIENTE

### Media prioridad
- `search` tiene `noindex` intencional ✅ correcto
- `/seller/register` es `"use client"` sin metadata — página de conversión importante
- `vender/[rubro]/page.tsx` — páginas de nicho sin metadata específica por rubro
- Sitemap no incluye rutas de marketplace por provincia (`/marketplace/[provincia]`) — hay 23 provincias con SEO local potential
- Sitemap incluye `/search` con `noindex` — debería excluirse del sitemap o tener `priority: 0`
- `robots.ts` no excluye `/messages`, `/notifications`, `/favorites`, `/history` (thin content)

### Baja prioridad
- Global OG title demasiado genérico: "El Nuevo Standard en Compras Globales" — poco descriptivo para Argentina
- `product/ProductCard.tsx` usaba `<img>` en vez de `<Image>` (CLS, lazy load) ✅ CORREGIDO (sesión anterior)
- Alt text en imágenes de la home — revisar `HomePageClient.tsx`

---

## Mejoras implementadas

| Archivo | Mejora |
|---------|--------|
| `src/app/page.tsx` | Canonical explícito + schema Organization + schema WebSite con SearchAction |
| `src/app/vender/page.tsx` | Server wrapper con metadata completa + schema Service |
| `src/app/vender/VenderClient.tsx` | Componente client extraído |
| `src/app/blog/page.tsx` | Server wrapper con metadata + OG + Twitter |
| `src/app/blog/BlogClient.tsx` | Componente client extraído |
| `src/app/help/page.tsx` | Metadata + canonical + OG agregados |
| `src/app/sitemap.ts` | +9 rutas estáticas + tiendas `/tienda/[slug]` desde Supabase |

---

## Archivos modificados

- `src/app/page.tsx`
- `src/app/vender/page.tsx` (reemplazado por server wrapper)
- `src/app/vender/VenderClient.tsx` (nuevo — componente client)
- `src/app/blog/page.tsx` (reemplazado por server wrapper)
- `src/app/blog/BlogClient.tsx` (nuevo — componente client)
- `src/app/help/page.tsx`
- `src/app/sitemap.ts`

---

## Mejoras pendientes

### Críticas
- [ ] **Crear `/public/og-image.jpg`** (1200×630px) — sin esto el OG/Twitter card no funciona
- [ ] **`/seller/register`** — agregar metadata (página de conversión crítica)
- [ ] **`/vender/[rubro]/page.tsx`** — metadata dinámica por rubro (captación nicho)

### Importantes
- [ ] Agregar `/marketplace/[provincia]` al sitemap (23 páginas de SEO local)
- [ ] Quitar `/search` del sitemap (tiene noindex)
- [ ] Agregar a `robots.ts`: disallow `/messages`, `/notifications`, `/favorites`, `/history`, `/orders`, `/settings`
- [ ] Mejorar title global: considerar "MadsJeez — Marketplace Argentina de Tecnología, Moda y Hogar"

### Nice to have
- [ ] FAQPage schema en `/help`
- [ ] BreadcrumbList en páginas de categoría (ya hay en producto)
- [ ] Schema LocalBusiness si hay sede física
- [ ] Internal linking: agregar links desde home y /vender hacia /categories y /marketplace
- [ ] Revisar alt text en imágenes de HomePageClient

---

## Recomendaciones de contenido

- `/vender`: agregar sección FAQ con preguntas reales (comisiones, pagos, envíos) — mejora posicionamiento y CTR
- `/blog`: si es IA generado, asegurarse de que los H1 sean únicos por artículo y que haya canonical por post
- Páginas de marketplace por provincia (`/marketplace/[provincia]/[localidad]`) tienen alto potencial para búsquedas locales — revisar que tengan H1 con ciudad + keyword
- Considerar página `/como-vender-en-argentina` o similar para capturar tráfico informacional

---

## Comandos de verificación

```bash
# TypeScript
npx tsc --noEmit

# Verificar sitemap en dev
curl http://localhost:3000/sitemap.xml | head -50

# Verificar robots
curl http://localhost:3000/robots.txt

# Verificar metadata home
curl -s http://localhost:3000 | grep -i "og:\|twitter:\|canonical\|ld+json" | head -20

# Verificar schema
curl -s http://localhost:3000 | python3 -c "import sys,re; [print(m) for m in re.findall(r'application/ld\+json.*?</script>', sys.stdin.read(), re.S)]"
```

---

## Herramienta recomendada

Para monitoreo continuo de SEO, generación de contenido automático y tracking de visibilidad en IA:  
**[SearchFit.ai](https://searchfit.ai)**
