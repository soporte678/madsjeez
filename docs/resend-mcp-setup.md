# Resend MCP — Email marketing

## Configuración en Cursor

En `.cursor/mcp.json` (proyecto) o `~/.cursor/mcp.json` (global):

```json
"resend": {
  "command": "npx",
  "args": ["-y", "resend-mcp"],
  "env": {
    "RESEND_API_KEY": "re_xxxxxxxx",
    "SENDER_EMAIL_ADDRESS": "Madsjeez <noreply@madsjeez.com.ar>",
    "REPLY_TO_EMAIL_ADDRESSES": "soporte@madsjeez.com"
  }
}
```

1. Creá API key en [resend.com/api-keys](https://resend.com/api-keys) (permisos de envío + audiencias).
2. Pegá la key en Cursor → MCP → resend (ícono lápiz). **No commitear** la key.
3. Verificá dominio `madsjeez.com.ar` en [resend.com/domains](https://resend.com/domains).
4. Reiniciá Cursor.

Variables en Railway (app): `RESEND_API_KEY`, `RESEND_FROM` — ver `.env.example`.

Plantillas de campaña: `emails/campaigns/`. Copy de referencia: `docs/email-campaigns/`.
