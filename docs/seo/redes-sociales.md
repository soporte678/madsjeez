# Redes sociales y Meta Pixel (SEO / social audit)

Para que herramientas como SEOptimer marquen **Facebook, Instagram, X, LinkedIn y YouTube** como vinculados, y para activar el **Facebook Pixel**, configurá estas variables en Railway (o `.env.local` en desarrollo):

| Variable | Ejemplo |
|----------|---------|
| `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL` | `https://www.facebook.com/tu-pagina` |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL` | `https://www.instagram.com/tu-cuenta` |
| `NEXT_PUBLIC_SOCIAL_X_URL` | `https://x.com/tu-cuenta` |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL` | `https://www.linkedin.com/company/tu-empresa` |
| `NEXT_PUBLIC_SOCIAL_YOUTUBE_URL` | `https://www.youtube.com/@tu-canal` |
| `NEXT_PUBLIC_FB_PIXEL_ID` | ID numérico del pixel (Meta Events Manager) |

Tras el deploy, los enlaces aparecen en el footer de la home y en `sameAs` del JSON-LD (`SiteJsonLd`).

**Google Business Profile:** creá o reclamá el perfil en [Google Business](https://business.google.com) con la misma dirección que el schema local (Spegazzini, Buenos Aires).

**Construcción de enlaces (prioridad alta en auditorías):** requiere PR, partners y directorios — ver `docs/seo/google-posicionamiento.md`.
