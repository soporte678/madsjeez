# Integración whatsapp-bot-pro-starter → Madsjeez

Starter ZIP: UI premium tipo WhatsApp Web + CRM (mock). Integrado en Madsjeez con **datos reales** vía Prisma + Evolution API.

## Qué se integró

| Starter | Madsjeez |
|---------|----------|
| `components/Inbox.tsx` | `WhatsappBotInboxView.tsx` + `WhatsappBotLayout.tsx` |
| `components/Sidebar.tsx` | `WhatsappBotLayout.tsx` |
| `components/Dashboard.tsx` | `WhatsappBotConfigView.tsx` |
| Orquestador | `WhatsappBotProView.tsx` |
| `components/ui.tsx` | `src/components/whatsapp-bot/ui.tsx` |
| `globals.css` estilos | `src/components/whatsapp-bot/whatsapp-bot-pro.css` |
| `supabase/schema.sql` | **No copiado** — ya existe `whatsapp_*` en Prisma |
| Cloud API webhook | Existente en `/api/meta/whatsapp` (admin); vendedor usa Evolution |

## Cómo verlo

1. `npm run dev`
2. Dashboard vendedor → **Bot de WhatsApp**
3. Pestaña **Configuración**: QR + bot IA
4. Pestaña **Inbox**: conversaciones reales

## Limitaciones honestas (Meta / Evolution)

- No se clona WhatsApp Web ni historial previo al QR.
- Etiquetas, notas internas y resumen IA avanzado: roadmap (UI preparada con mensaje).
- Cloud API + `schema.sql` del starter: referencia para futuro canal admin/empresa.

## Archivos clave

- `src/components/whatsapp-bot/WhatsappBotLayout.tsx`
- `src/components/whatsapp-bot/WhatsappBotInboxView.tsx`
- `src/components/whatsapp-bot/WhatsappBotConfigView.tsx`
- `src/components/whatsapp-bot/WhatsappBotProView.tsx`
- `src/components/whatsapp-bot/types.ts`
- `src/components/dashboard/WhatsappBotView.tsx` (wrapper)
- `.cursor/rules/whatsapp-bot-crm-auto.mdc`

## Qué debés hacer vos (manual)

1. **`.env.local`** — `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_SECRET`, `WHATSAPP_AI_PROVIDER=ollama` (dev), URLs locales. Script: `scripts/setup-whatsapp-bot-local.ps1`
2. **Railway (prod)** — Evolution URL + keys + `GEMINI_API_KEY`; Ollama en prod solo con URL pública (no `localhost`)
3. **QR** — Dashboard → Bot de WhatsApp → Configuración → Conectar → escanear
4. **Activar bot** — checkbox “Activar bot automático”
5. **Prueba** — mensaje desde otro celular (solo mensajes **nuevos** post-QR)

## Próximos pasos opcionales

- Migración Prisma: `tags`, `internal_notes` en `WhatsappLead`
- Meta chat history sharing (coexistence) documentado en Meta dev docs
- Unificar admin Cloud API inbox con misma UI (segundo canal)
