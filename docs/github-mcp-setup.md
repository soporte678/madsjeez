# GitHub MCP — Cursor

Repositorio: **soporte678/madsjeez** (`https://github.com/soporte678/madsjeez.git`)

## Configuración

El proyecto incluye `.cursor/mcp.json` con el servidor remoto oficial:

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer YOUR_GITHUB_PAT"
  }
}
```

## Token (obligatorio)

1. Creá un **Personal Access Token** en GitHub: [Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Tipo recomendado: **Fine-grained** o **Classic** con scopes mínimos según uso:
   - `repo` (repos privados)
   - `read:org` (si aplica)
   - `workflow` (leer/ejecutar Actions si lo necesitás)
3. En Cursor: **Settings → Tools & MCP → github** (ícono lápiz) y reemplazá `YOUR_GITHUB_PAT` por el token.
4. **No** commitees el PAT. Preferí configurarlo en `~/.cursor/mcp.json` global si el repo es público.

Alternativa local (Docker): ver [install-cursor.md](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-cursor.md) con `GITHUB_PERSONAL_ACCESS_TOKEN` en `env`.

## Verificación

Tras guardar y **reiniciar Cursor**, el agente puede listar issues, PRs, workflow runs y logs sin abrir github.com manualmente.

## Seguridad

- No borrar branches, merges ni workflows sin confirmación explícita.
- No imprimir tokens en chat ni en commits.
