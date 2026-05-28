# JARVISION 3.0 - Estado del Sistema

> **Sistema:** JARVIS v3.0 | **Ultima Actualizacion:** Sesion activa
> **Documento maestro de configuracion, MCP, autenticacion y pendientes.**

---

## 1. Estado General

| Componente | Estado | Detalle |
|---|---|---|
| **OS Host** | Windows (Mi Pc) | Maquina fisica principal |
| **Sandbox** | Linux (Kimi Cloud) | Entorno de ejecucion actual |
| **Node.js** | v20.20.2 | Runtime principal |
| **Railway CLI** | 4.65.0 | Autenticado como `soporte@madsjeez.com` |
| **Project Railway** | `brilliant-elegance` (madsjeez) | Activo y desplegado |
| **GitHub Token** | Activo (`ghp_***`) | Usado via API REST |
| **Supabase Key** | Disponible (Service Role) | En variables de Railway |
| **MCP Servers** | 5/7 configurados | 2 requieren PC Windows |
| **Gate de Confirmacion** | Activo | Operaciones criticas protegidas |
| **Nivel de Control** | **Alta autonomia en lectura + verificacion** | Escritura controlada por gate |

---

## 2. MCP Configurados

### 2.1 Archivos de Configuracion (4)

| # | Archivo | Proposito | Estado |
|---|---|---|---|
| 1 | `~/.cursor/mcp.json` | Cursor IDE | Configurado |
| 2 | `~/.claude.json` | Claude Desktop | Configurado |
| 3 | `~/.codex/config.toml` | Codex CLI | Configurado |
| 4 | `~/.config/mcp/servers.json` | Servidor MCP central | Configurado |

### 2.2 Servidores MCP (5 activos)

#### Railway MCP - [X] Configurado

| Campo | Valor |
|---|---|
| **Tools disponibles** | 34 |
| **Autenticacion** | OAuth + Device Flow |
| **Cuenta** | `soporte@madsjeez.com` |
| **Proyecto** | `brilliant-elegance` |

**Tools principales:**

```
deploy          - Desplegar servicios en Railway
logs            - Ver logs en tiempo real
variables       - Gestionar variables de entorno
status          - Estado de servicios y deploys
metrics         - Metricas de rendimiento
services        - Gestion de servicios del proyecto
```

#### Chrome DevTools MCP - [X] Configurado

| Campo | Valor |
|---|---|
| **Autenticacion** | No requiere |
| **Uso** | Inspeccion visual de paginas web |

**Capacidades:**

```
screenshots     - Capturar pantalla de paginas
DOM             - Inspeccionar estructura del documento
console         - Ver logs de la consola del navegador
network         - Analizar trafico de red
elements        - Navegar y extraer elementos
```

#### Playwright MCP - [X] Configurado

| Campo | Valor |
|---|---|
| **Autenticacion** | No requiere |
| **Uso** | Automatizacion de navegador |

**Capacidades:**

```
navigation      - Navegar a URLs y cambiar pestanas
clicks          - Simular clicks en elementos
forms           - Rellenar y enviar formularios
automation      - Flujos completos de automatizacion
typing          - Escribir texto en campos
```

#### GitHub MCP - [O] Parcial (placeholder)

| Campo | Valor |
|---|---|
| **Token** | `ghp_***` (activo via API REST) |
| **Config MCP** | Pendiente: token en archivo MCP |
| **Uso actual** | Via API REST directa |

**Tools disponibles (cuando se configure):**

```
repos           - Listar y gestionar repositorios
issues          - Crear, leer, actualizar issues
prs             - Crear y gestionar pull requests
branches        - Gestionar ramas
commits         - Ver historial y crear commits
```

> **Accion requerida:** Inyectar token `ghp_***` en `~/.claude.json` y `~/.config/mcp/servers.json` para habilitar tools MCP nativas.

#### Supabase MCP - [O] Parcial (placeholder)

| Campo | Valor |
|---|---|
| **Service Role Key** | Disponible en variables de Railway |
| **Config MCP** | Pendiente: key en archivo MCP |
| **Uso actual** | Via cliente Supabase directo |

**Tools disponibles (cuando se configure):**

```
tables          - Listar y gestionar tablas
rows            - CRUD sobre filas
storage         - Gestionar archivos en buckets
auth            - Gestionar usuarios y autenticacion
rls             - Verificar politicas RLS
```

> **Accion requerida:** Extraer `SUPABASE_SERVICE_ROLE_KEY` de variables de Railway y configurar en archivos MCP.

---

## 3. Archivos Modificados en esta Sesion

| # | Archivo | Accion | Motivo |
|---|---|---|---|
| 1 | `~/.cursor/mcp.json` | Creado/modificado | Configurar Railway MCP |
| 2 | `~/.claude.json` | Creado/modificado | Configurar Railway MCP |
| 3 | `~/.codex/config.toml` | Creado/modificado | Configurar Railway MCP |
| 4 | `~/.config/mcp/servers.json` | Creado/modificado | Configurar Railway MCP |

---

## 4. Nivel de Control por Capa

| Capa | Nivel | Autonomia | Descripcion |
|---|---|---|---|
| **Lectura / Observacion** | **Verde** | Completa | Logs, metricas, status, screenshots, DOM, archivos |
| **Navegacion Web** | **Verde** | Completa | Navegar paginas, clicks, formularios, screenshots |
| **Reportes / Checklists** | **Verde** | Completa | Crear documentacion, checklists, analisis |
| **Deploy Railway** | **Amarillo** | Gate requerido | Puedo ejecutar pero PIDE confirmacion previa |
| **Variables de entorno** | **Amarillo** | Gate requerido | Lectura libre, escritura con confirmacion |
| **GitHub (API REST)** | **Amarillo** | Gate requerido | Token activo, acciones con confirmacion |
| **Supabase (directo)** | **Amarillo** | Gate requerido | Service key disponible, escritura con gate |
| **Mensajes a clientes** | **Rojo** | Gate obligatorio | NUNCA enviar sin confirmacion explicita |
| **Pagos / Bancos** | **Rojo** | Prohibido | NUNCA tocar sin confirmacion humana |
| **Instalacion software** | **Amarillo** | Gate requerido | Confirmacion para software sensible |
| **Migraciones destructivas** | **Rojo** | Gate obligatorio | DB reset, drop tables = confirmacion |

### Leyenda

```
Verde  = Autonomo completo, no requiere confirmacion
Amarillo = Puede ejecutar pero DEBE pedir confirmacion antes
Rojo   = Prohibido sin confirmacion explicita del usuario
```

---

## 5. Seguridad y Gates

### 5.1 Gate de Confirmacion - Activo

**Operaciones que REQUIEREN confirmacion explicita:**

- [ ] Deploy a produccion
- [ ] Rollback de servicio
- [ ] Delete de servicio/recurso
- [ ] Reset de base de datos
- [ ] Migraciones destructivas (drop column, drop table)
- [ ] Cambiar variables de entorno en produccion
- [ ] Enviar mensajes, emails o notificaciones a clientes
- [ ] Tocar pagos, bancos o informacion financiera
- [ ] Instalar software sensible o con permisos elevados
- [ ] Crear/eliminar usuarios con privilegios
- [ ] Modificar politicas de seguridad (RLS, firewalls)

### 5.2 Acciones AUTONOMAS (sin confirmacion)

- [X] Ver logs de servicios
- [X] Ver status de deploys
- [X] Ver metricas de rendimiento
- [X] Navegar paginas web
- [X] Tomar screenshots
- [X] Inspeccionar DOM y consola
- [X] Crear reportes y documentacion
- [X] Crear checklists
- [X] Leer archivos y configuraciones
- [X] Monitorear deploys en curso
- [X] Analizar codigo y estructuras
- [X] Buscar en documentacion

### 5.3 Protocolo de Confirmacion

```
1. Yo identifico que la accion requiere gate
2. Te presento: QUE voy a hacer, POR QUE, y el IMPACTO
3. Espero tu confirmacion ("si", "ok", "confirmado", "adelante")
4. Solo entonces ejecuto
5. Reporto el resultado
```

---

## 6. Herramientas Pendientes (Requieren PC Windows)

| # | Herramienta | Estado | Bloqueador | Prioridad |
|---|---|---|---|---|
| 1 | **Power Automate Desktop** | Pendiente | Requiere Windows | Alta |
| 2 | **Screenpipe** (memoria visual) | Pendiente | Requiere Windows | Media |
| 3 | **Open Interpreter OS Mode** | Pendiente | Requiere Windows | Media |
| 4 | **Control por Voz** | Pendiente | Requiere Windows | Baja |

### Detalle de pendientes

#### 6.1 Power Automate Desktop

```
Uso:      Automatizacion de UI en Windows
Estado:   No instalado
Bloqueo:  Solo disponible en Windows
Prioridad: ALTA - Habilita automatizacion de aplicaciones de escritorio
Accion:   Instalar cuando este en PC fisica
```

#### 6.2 Screenpipe (Memoria Visual)

```
Uso:      Grabar pantalla + OCR para memoria contextual
Estado:   No instalado
Bloqueo:  Requiere acceso a pantalla fisica (Windows)
Prioridad: MEDIA - Memoria visual persistente
Accion:   Evaluar instalacion en PC Windows
```

#### 6.3 Open Interpreter OS Mode

```
Uso:      Control del sistema operativo via lenguaje natural
Estado:   No instalado
Bloqueo:  Requiere entorno local Windows
Prioridad: MEDIA - Control total del sistema
Accion:   Instalar y configurar permisos en PC
```

#### 6.4 Control por Voz

```
Uso:      Interaccion hands-free
Estado:   No configurado
Bloqueo:  Requiere microfono + entorno local
Prioridad: BAJA - Mejora UX pero no bloqueante
Accion:   Evaluar Whisper o similar en Windows
```

---

## 7. Comandos de Prueba

### 7.1 Verificar Railway MCP

```bash
# Ver estado del CLI
railway --version

# Ver proyecto actual
railway status

# Ver logs (autonomo)
railway logs

# Ver variables (autonomo)
railway variables
```

### 7.2 Verificar GitHub Token

```bash
# Verificar token (autonomo - solo lectura de usuario)
curl -H "Authorization: token ghp_***" \
  https://api.github.com/user

# Listar repos (autonomo)
curl -H "Authorization: token ghp_***" \
  https://api.github.com/user/repos
```

### 7.3 Verificar Supabase

```bash
# Verificar conexion (requiere SUPABASE_SERVICE_ROLE_KEY)
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://[PROJECT_REF].supabase.co/rest/v1/
```

### 7.4 Verificar MCP Servers

```bash
# Lista de servidores MCP configurados
cat ~/.config/mcp/servers.json

# Verificar configuracion Cursor
cat ~/.cursor/mcp.json

# Verificar configuracion Claude
cat ~/.claude.json

# Verificar configuracion Codex
cat ~/.codex/config.toml
```

### 7.5 Comandos de Diagnostico

```bash
# Nodo y npm
node --version
npm --version

# Railway CLI detalle
railway --version
railway whoami

# Estado de red
ping -c 3 railway.app

# Variables de entorno relevantes
env | grep -i -E "(railway|supabase|github)" || echo "No hay variables expuestas"
```

---

## 8. Proximos Pasos

### Inmediatos (esta sesion)

- [ ] Completar configuracion GitHub MCP (inyectar token en archivos)
- [ ] Completar configuracion Supabase MCP (inyectar service key)
- [ ] Validar todos los servidores MCP con comando de prueba
- [ ] Documentar flujos de trabajo habituales

### Corto plazo (proximas sesiones)

- [ ] Instalar Power Automate Desktop en PC Windows
- [ ] Configurar Screenpipe para memoria visual
- [ ] Implementar Open Interpreter OS Mode
- [ ] Crear libreria de scripts de automatizacion
- [ ] Documentar runbooks para operaciones comunes

### Mediano plazo

- [ ] Implementar control por voz
- [ ] Integrar memoria persistente entre sesiones
- [ ] Automatizar deploys CI/CD via MCP
- [ ] Crear dashboard de monitoreo unificado

---

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigacion |
|---|---|---|---|
| **Token GitHub expuesto** | Critico | Baja | Token almacenado solo en variables de entorno, nunca en codigo. Rotar si se sospecha exposicion. |
| **Supabase Service Key expuesta** | Critico | Baja | Key solo en variables de Railway. Usar RLS como capa adicional. Rotar periodicamente. |
| **Deploy accidental a prod** | Alto | Media | **Gate activo** - requiere confirmacion explicita. Doble verificacion en nombre de servicio. |
| **Migracion destructiva** | Alto | Baja | **Gate activo** - backup automatico antes de migraciones. Solo con confirmacion. |
| **Automatizacion sin supervision** | Medio | Media | Acciones autonomas limitadas a lectura. Escritura siempre con gate. |
| **Dependencia de PC Windows** | Medio | Alta | Herramientas criticas deben funcionar en sandbox. PC Windows como capa opcional, no bloqueante. |
| **Sesion de Railway expira** | Medio | Media | Re-autenticar via `railway login`. OAuth persistente con refresh token. |
| **Rate limiting en APIs** | Bajo | Media | Implementar retries con backoff. Cachear respuestas cuando sea posible. |

---

## Checklist de Estado del Sistema

```
Infraestructura:
  [X] Railway CLI autenticado
  [X] Proyecto Railway identificado (brilliant-elegance)
  [X] Node.js v20.20.2
  [X] Sandbox Linux operativo

MCP Servers:
  [X] Railway MCP (34 tools)
  [X] Chrome DevTools MCP
  [X] Playwright MCP
  [O] GitHub MCP (placeholder - token activo via REST)
  [O] Supabase MCP (placeholder - key disponible)

Seguridad:
  [X] Gate de confirmacion activo
  [X] Lista de operaciones criticas definida
  [X] Acciones autonomas documentadas
  [X] Protocolo de confirmacion establecido

Pendientes Windows:
  [ ] Power Automate Desktop
  [ ] Screenpipe
  [ ] Open Interpreter OS Mode
  [ ] Voz
```

---

> **Nota:** Este documento es el estado de verdad del sistema JARVIS v3.0.
> Actualizar despues de cada sesion significativa.
