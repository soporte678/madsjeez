# Galaxy Online II - Research & Documentation

## ¿Qué era Galaxy Online II?

Galaxy Online II (GO2) fue un MMO de estrategia espacial desarrollado por IGG (I Got Games) que se jugaba principalmente en Facebook y en navegadores web mediante Flash Player. El juego combinaba:

- **Estrategia 4X** (eXplore, eXpand, eXploit, eXterminate)
- **Construcción de imperio espacial**
- **Combate táctico por turnos** con formaciones de flotas
- **Gestión de recursos** y economía planetaria
- **Comandantes** con habilidades y módulos equipables
- **Investigación tecnológica** desbloqueable
- **Alianzas** y guerra entre jugadores
- **Misiones PvE** (instancias/espacios temporales)

### Cierre del juego original

El 12 de enero de 2021, Galaxy Online II cerró sus servidores debido al fin del soporte de Adobe Flash Player. IGG ofreció "recompensas de lealtad" para otros juegos de su portfolio (Lords Mobile, Castle Clash, etc.) pero no una migración del progreso.

## Proyectos de la comunidad

### SuperGO2
- **Tipo**: Servidor privado/recreación
- **URL**: https://supergo2.com / https://beta.supergo2.com
- **Estado**: Open-Alpha (desde 2022)
- **Plataformas**: Windows, macOS, Linux, Android, iOS
- **GitHub**: https://github.com/SuperGO2/supergo2-issues
- **Acceso**: Launcher personalizado o Flash Browser
- **Descripción**: Intenta revivir el juego original con posibles mejoras futuras (nuevos planos, comandantes, constelaciones)

### KrTools
- **Tipo**: Herramientas de planificación/calculadoras
- **URL**: https://krtools.deajae.co.uk
- **Autor**: DeaJae
- **GitHub**: https://github.com/DeaJae/Krtools-clone
- **Funciones**:
  - Ship Designer (diseño de naves con módulos)
  - Instance Viewer (misiones PvE)
  - Commander Calculator
- **Estado**: Archivado, código disponible en GitHub

### GO2-Adapter
- **Tipo**: API Java para conexión a servidores GO2
- **GitHub**: https://github.com/SkimnerPhi/GO2-Adapter
- **Descripción**: API Java para conectar con servidores Galaxy Online II

## Fuentes de información

| Fuente | Tipo | Estado |
|--------|------|--------|
| SuperGO2 GitHub | Issues/Documentación | Activo |
| KrTools | Herramientas web | Archivado |
| Galaxy Online II Fandom | Wiki | Inaccesible (403) |
| Galaxy Online 2 Fandom ES | Wiki | Inaccesible (403) |
| SuperGO2 Discord | Comunidad | Activo |
| Facebook SuperGO2 | Red social | Referencia |

## Objetivo de este proyecto

Crear una versión **moderna e inspirada** en Galaxy Online II, **NO un clon ilegal**:

- ✅ Arquitectura técnica moderna (no Flash)
- ✅ Nuevo lore y nombres propios
- ✅ Sistemas de juego inspirados pero rediseñados
- ✅ Código propio, nada de ingeniería inversa
- ✅ Assets originales
- ✅ Backend escalable
- ✅ Multiplataforma (web + mobile)

## Qué NO es este proyecto

- ❌ No es SuperGO2 ni está relacionado con ellos
- ❌ No usa código ni assets de IGG
- ❌ No es un emulador privado
- ❌ No reclama derechos sobre Galaxy Online II
- ❌ No busca replicar exactamente el juego original

## Estructura de documentación

| Documento | Propósito |
|-----------|-----------|
| `sources.md` | Fuentes de investigación y evaluación legal |
| `game-systems.md` | Sistemas de juego documentados (15+) |
| `data-model.md` | Esquema de entidades con SQL |
| `combat-model.md` | Sistema de combate con fórmulas propias |
| `mvp.md` | Visión general del MVP |
| `mvp-spec-v0.md` | **Especificación técnica exacta MVP v0** |
| `rebuild-plan.md` | Stack técnico y fases de desarrollo |
| `legal-safety.md` | Guía de seguridad legal |
| `glossary.md` | Glosario ES/EN de términos del juego |
| `open-questions.md` | Dudas y decisiones pendientes |
| `implementation-roadmap.md` | **Roadmap semana a semana (8 semanas)** |
| `agent-next-tasks.md` | **Tareas listas para agentes de desarrollo** |

---

*Research iniciado: Mayo 2026*  
*Propósito: Inspiración legal y planificación técnica*
