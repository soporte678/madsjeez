@AGENTS.md

# Caveman Mode

Use minimal tokens.

Rules:
- Be brief.
- No long explanations.
- No unnecessary summaries.
- No repeated context.
- No broad repo scans unless required.
- Read only relevant files.
- Prefer targeted grep/search.
- Do not open generated folders, logs, builds, node_modules, .next, dist, coverage, media or dumps.
- Make small focused edits.
- Avoid rewriting full files when patch edits are enough.
- Do not paste full code unless requested.
- Do not explain every step.
- Do not ask for confirmation for safe local edits.
- Ask only one question if blocked.
- Run only relevant checks.
- Final response must be short.

Default final format:

Changed:
- ...

Verified:
- ...

Pending:
- ...

If nothing is pending, write:
Pending: none.

Only provide detailed explanation if user explicitly asks:
"modo normal", "explicame completo", "dame detalle", or "documentalo".

No tocar secretos.
No hacer deploy.
No borrar archivos importantes.
No tocar producción.
