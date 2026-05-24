# MVP - Producto Mínimo Viable

Definición del MVP jugable para un juego inspirado en Galaxy Online II.

---

## Objetivo del MVP

Crear una versión **jugable, divertida y estable** que capture la esencia del loop de juego, sin todas las features complejas.

**Duración estimada**: 2-3 meses con equipo reducido (1-2 devs)

---

## User Stories MVP

### Auth & Onboarding
- [ ] Como jugador, quiero registrarme con email para guardar mi progreso
- [ ] Como jugador, quiero ver un tutorial inicial que me enseñe las mecánicas básicas
- [ ] Como jugador, quiero recuperar mi contraseña si la olvido

### Imperio y Planetas
- [ ] Como jugador, quiero tener un planeta inicial con slots de construcción
- [ ] Como jugador, quiero construir edificios que produzcan recursos
- [ ] Como jugador, quiero ver mis recursos actuales y producción por hora
- [ ] Como jugador, quiero mejorar edificios existentes

### Sistema de Recursos
- [ ] Como jugador, quiero recolectar Metal pasivamente
- [ ] Como jugador, quiero recolectar He3 (combustible)
- [ ] Como jugador, quiero tener Gold para comercio
- [ ] Como jugador, quiero ver cuando mis almacenes están llenos

### Investigación
- [ ] Como jugador, quiero investigar tecnologías que mejoren mi imperio
- [ ] Como jugador, quiero ver un árbol simple de investigaciones
- [ ] Como jugador, quiero que las investigaciones desbloqueen nuevas naves

### Astillero y Naves
- [ ] Como jugador, quiero construir diferentes tipos de naves
- [ ] Como jugador, quiero ver las stats de cada tipo de nave
- [ ] Como jugador, quiero tener al menos 3 tipos: Fragata, Crucero, Acorazado

### Flotas
- [ ] Como jugador, quiero crear flotas combinando naves
- [ ] Como jugador, quiero asignar naves a posiciones en una formación simple (2x2)
- [ ] Como jugador, quiero ver el poder total de mi flota

### Combate PvE
- [ ] Como jugador, quiero enfrentar misiones PvE contra IA
- [ ] Como jugador, quiero ver un reporte de batalla detallado ronda por ronda
- [ ] Como jugador, quiero recibir recompensas por ganar (recursos, exp)
- [ ] Como jugador, quiero tener 3 niveles de dificultad de misiones

### Reporte de Batalla
- [ ] Como jugador, quiero ver cuántas naves perdí/gané
- [ ] Como jugador, quiero ver el daño que hizo cada lado
- [ ] Como jugador, quiero ver ronda por ronda qué pasó

### Progresión
- [ ] Como jugador, quiero ganar experiencia y subir de nivel
- [ ] Como jugador, quiero que al subir de nivel se desbloqueen cosas
- [ ] Como jugador, quiero ver mi nivel actual en el UI

### Leaderboard
- [ ] Como jugador, quiero ver un ranking de jugadores por poder total
- [ ] Como jugador, quiero ver mi posición en el ranking

---

## Features FUERA del MVP (Post-MVP)

| Feature | Prioridad Post-MVP | Razón de exclusión |
|---------|-------------------|-------------------|
| Comandantes | Alta | Sistema complejo, balance delicado |
| Módulos equipables | Alta | UI compleja, muchos items |
| PvP real | Alta | Sistema de matchmaking, anti-cheat |
| Alianzas | Media | Requiere chat, permisos, gestión |
| Múltiples planetas | Media | Expansión de imperio, colonización |
| Comercio entre jugadores | Media | Economía compleja, exploits |
| Eventos temporales | Media | Sistema de scheduling |
| Comandantes con skills | Baja | Más complejo que comandantes base |
| Instancias complejas (olas) | Baja | IA más sofisticada |
| Arte 3D | Baja | 2D suficiente para validar gameplay |
| Mobile app nativa | Baja | Web responsive primero |

---

## Flujo de Usuario MVP

```
REGISTRO → TUTORIAL → PRIMER PLANETA
                ↓
    CONSTRUIR MINA DE METAL (instante para demo)
                ↓
    ESPERAR RECURSOS / CONSTRUIR ASTILLERO
                ↓
    CONSTRUIR NAVES (5 fragatas)
                ↓
    CREAR PRIMERA FLOTA → ASIGNAR NAVES
                ↓
    IR A MISIÓN PvE NIVEL 1
                ↓
    VER REPORTE DE BATALLA → COBRAR RECOMPENSA
                ↓
    LOOP: Mejorar → Más naves → Misiones más difíciles
                ↓
    CHEQUEAR LEADERBOARD
```

---

## Pantallas/UI Requeridas

### 1. Auth
- Login
- Register
- Forgot password

### 2. Dashboard Principal
- Recursos actuales (Metal, He3, Gold)
- Producción por hora
- Planeta activo (click para ver)
- Flotas activas/resumen
- Misión PvE rápida (CTA)

### 3. Vista de Planeta
- Grid de edificios (slots)
- Cola de construcción
- Recursos del planeta
- Navegación a astillero

### 4. Astillero
- Lista de tipos de naves desbloqueados
- Stats comparativas
- Formulario de construcción (tipo + cantidad)
- Cola de construcción

### 5. Flotas
- Lista de flotas
- Crear nueva flota
- Editor de formación (2x2 grid)
- Asignar naves a slots
- Ver poder total

### 6. Misiones PvE
- Lista de misiones (3 niveles)
- Requisitos de poder
- Recompensas previas
- Botón "Lanzar" (selecciona flota)

### 7. Reporte de Batalla
- Resultado (Victoria/Derrota)
- Resumen de pérdidas
- Timeline de rondas
- Recompensas obtenidas

### 8. Investigación
- Árbol simple (grid o lista)
- Investigaciones completadas/pendientes
- Costos y tiempos
- Cola de investigación

### 9. Leaderboard
- Tabla de jugadores
- Mi posición destacada
- Filtros: Global, Esta semana

---

## Especificaciones Técnicas MVP

### Backend
- **Framework**: Node.js + Express / Fastify
- **DB**: PostgreSQL (datos) + Redis (cache/sessions)
- **Auth**: JWT tokens
- **Jobs**: Bull/BullMQ para timers (construcción, batallas)
- **API**: REST (WebSockets post-MVP)

### Frontend
- **Framework**: React / Vue / Svelte
- **State**: Zustand / Pinia / Redux
- **UI Library**: Tailwind + Headless UI / shadcn
- **Charts**: Recharts para estadísticas
- **Build**: Vite

### Infraestructura
- **Hosting**: Railway / Render / Fly.io
- **DB**: Supabase / Neon
- **Storage**: Cloudinary (si hay assets)
- **CDN**: Cloudflare (post-MVP)

---

## Métricas de Éxito MVP

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| Registro completado | >70% de starts | Analytics funnel |
| Tutorial completado | >80% de registrados | Evento completado |
| Primera batalla | >60% en primer día | Evento batalla |
| Retención D1 | >40% | Usuarios que vuelven |
| Retención D7 | >15% | Weekly active |
| Sesiones por usuario | >3 en primera semana | Mixpanel/Amplitude |
| Tiempo promedio | >10 min por sesión | Analytics |

---

## Plan de Desarrollo (8 semanas)

### Semana 1-2: Fundamentos
- Setup proyecto (frontend + backend)
- Auth system
- DB schema básico
- CRUD de edificios

### Semana 3-4: Core Loop
- Sistema de recursos (producción pasiva)
- Astillero básico (3 tipos de naves)
- Construcción de naves

### Semana 5: Flotas y Formaciones
- Creación de flotas
- Editor de formación 2x2
- Cálculo de poder

### Semana 6: Combate
- Simulador de batalla
- 3 misiones PvE
- Generación de reportes
- UI de reporte

### Semana 7: Progresión y Polish
- Sistema de XP/levels
- Investigación básica
- Leaderboard
- Tutorial onboarding

### Semana 8: Testing y Deploy
- QA interno
- Bug fixes
- Deploy a producción
- Analytics setup

---

## Checklist de Launch

- [ ] Tests automáticos (core functions)
- [ ] Manejo de errores (toast notifications)
- [ ] Loading states en todas las pantallas
- [ ] Mobile responsive
- [ ] Analytics básicos implementados
- [ ] Privacy policy / TOS
- [ ] Rate limiting en API
- [ ] Backup automático de DB
- [ ] Monitoring (Sentry/LogRocket)
- [ ] Comunidad (Discord) lista

---

*Nota: Este MVP es deliberadamente limitado. El objetivo es validar que el core loop es divertido antes de invertir en features complejas.*
