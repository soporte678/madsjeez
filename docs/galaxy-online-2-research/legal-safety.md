# Guía de Seguridad Legal

Cómo crear un juego inspirado en Galaxy Online II sin infringir derechos.

---

## ⚠️ Qué NO Copiar Bajo Ninguna Circunstancia

### Propiedad Intelectual de IGG
| Categoría | Ejemplos | Consecuencias |
|-----------|----------|---------------|
| **Nombre del juego** | "Galaxy Online II", "GO2", "Galaxy Online 2" | Cese y desistimiento, demanda |
| **Nombres de personajes** | Cualquier NPC, comandante, lore | Infracción de copyright |
| **Textos originales** | Descripciones, diálogos, misiones | Copyright |
| **Assets gráficos** | Sprites, UI, fondos, naves | Copyright + DMCA |
| **Assets de audio** | Música, efectos de sonido | Copyright |
| **Código fuente** | Cualquier archivo del juego | Copyright + posible denuncia penal |
| **Base de datos** | Stats exactas, fórmulas originales | Trade secret misappropriation |
| **Ejecutables** | Cliente Flash, launchers | Violación de ToS, piratería |

### Código de Proyectos de la Comunidad
| Proyecto | Qué NO usar |
|----------|-------------|
| **SuperGO2** | Código del servidor, assets, nombre |
| **GO2-Adapter** | Implementación específica de API |
| **KrTools** | Código de calculadoras (diseño UI sí) |

> **Regla de oro**: Si alguien más lo creó y no tiene licencia open source explícita, **NO lo uses**.

---

## ✅ Qué SÍ se Puede Usar (Inspiración Legal)

### Mecánicas de Juego
Las mecánicas de juego **no son protegibles** por copyright:

| Mecánica GO2 | Inspiración permitida |
|--------------|----------------------|
| Sistema de recursos (Metal, He3) | ✅ Usar tipos similares con nombres diferentes |
| Árbol de investigación | ✅ Estructura similar, contenido propio |
| Combate por turnos con formaciones | ✅ Sistema idéntico es legal |
| Naves con stats | ✅ Stats básicos (HP, ATK, DEF) son genéricos |
| Timers de construcción | ✅ Mecánica común en 4X |
| Misiones PvE | ✅ Estructura de ola/dificultad |

**Ejemplo legal**:
```
GO2: "Cruiser" con 1000 HP, 200 ATK
Nuestro juego: "Vanguard" con 950 HP, 210 ATK  
✅ Diferente nombre, stats similares pero no idénticos
```

### Conceptos Genéricos
- Imperios espaciales
- Colonización de planetas
- Guerras interestelares
- Tecnología de naves
- Alianzas y política
- Economía de recursos

**Referencia**: Stellaris, Endless Space, Astro Empires, OGame — todos comparten conceptos.

### Investigación Pública
- Artículos sobre GO2
- Wikis (información factual, no textos)
- Gameplay videos (observación)
- Comentarios de comunidad
- Análisis de diseño de juego

---

## 🎨 Creación de Assets Propios

### Nombres

#### Naves
```
❌ Galaxy Online II names:
- Cruiser, Battleship, Fighter, Destroyer

✅ Our names (inspired, not copied):
- "Vanguard" (medio, balance)
- "Titan" (pesado, tanque)
- "Wasp" (ligero, scout)
- "Harbinger" (bombardero)
```

#### Recursos
```
❌ GO2: Metal, He3, Gold
✅ Ours: Iron, Plasma Cells, Credits
```

#### Facciones/Lore
```
❌ Lore específico de GO2
✅ Crear universo propio:
   - Confederación Terranova (humanos)
   - Imperio K'thar (aliens insectoides)
   - Colectivo Syn (IA)
   - Independientes (piratas)
```

### Arte

| Tipo | Enfoque |
|------|---------|
| **Naves** | Diseño original, siluetas diferentes |
| **Planetas** | Procedural o assets libres de derechos |
| **UI** | Inspirarse en layout general, no copiar elementos |
| **Iconos** | Crear desde cero o usar sets CC0 |

**Recursos legales de assets**:
- Kenney.nl (CC0 game assets)
- itch.io (buscar "CC0", "public domain")
- Unity Asset Store (comprar licencia)
- Contratar artista original

### Audio
- **Música**: Artistas indie, licencias royalty-free (Epidemic Sound, Artlist)
- **SFX**: Generar con sfxr, Bfxr, o librerías CC0

---

## 📋 Checklist de Cumplimiento Legal

### Pre-Development
- [ ] Nombre del proyecto único (verificar USPTO, trademark search)
- [ ] Dominio registrado (.com, .io, etc.)
- [ ] Logo original diseñado
- [ ] Lore/universo documentado (propiedad intelectual propia)

### Durante Desarrollo
- [ ] Ningún archivo de GO2 en el repo
- [ ] Ningún código de SuperGO2 copiado
- [ ] Stats y fórmulas derivadas, no copiadas
- [ ] Assets 100% originales o con licencia válida
- [ ] Textos escritos por nosotros, no traducciones

### Pre-Launch
- [ ] Terms of Service escritos (no copiar de IGG)
- [ ] Privacy Policy (GDPR/CCPA compliant)
- [ ] DMCA policy (si permite UGC)
- [ ] Registro de copyright de nuestro código/assets
- [ ] Trademark del nombre (opcional pero recomendado)

### Post-Launch
- [ ] Monitorear por clones que copien NUESTRO juego
- [ ] Responder a claims legítimos (si los hay)
- [ ] Mantener registro de creación de assets

---

## 🔍 Investigación Segura

### Fuentas seguras
```
✅ LEER:
- Wikipedia (mecánicas de 4X games)
- Gamasutra (artículos de diseño)
- YouTube: "4X game design analysis"
- Libros: "A Theory of Fun", "Game Design Workshop"

⚠️ LEER CON CUIDADO (no copiar textos):
- Wikis de GO2 (información factual solamente)
- Foros de comunidad (opiniones)

❌ NO USAR:
- Cualquier archivo descargable de GO2
- Código de emuladores privados
- Assets "extraídos" o "rippeados"
```

### Notas de investigación
Cuando investigues, toma notas así:
```
FUENTE: Galaxy Online 2 Wiki
NOTA: El juego usa un sistema de 4 recursos principales
MI INTERPRETACIÓN: Nuestro juego usará 3 recursos: Iron, 
                   Plasma, Credits
RAZÓN: Simplificación + diferenciación
```

---

## 🛡️ Protegiendo Nuestro Propio Trabajo

### Licencias recomendadas

**Código**:
```
MIT License - Permite uso comercial, requiere atribución
BUSL (BSL) - Código abierto pero no competencia por X años
Proprietary - Código cerrado (más común en juegos)
```

**Assets**:
```
Todos los derechos reservados © 2026 [Studio Name]
```

### Registro de IP
| Tipo | Costo aproximado | Prioridad |
|------|------------------|-----------|
| Copyright automático | Gratis | Alta (ya aplicado al crear) |
| Copyright registrado | $35-55 (US) | Media |
| Trademark nombre | $250-400 por clase | Alta post-MVP |
| Trademark logo | $250-400 por clase | Media |

---

## ⚖️ Si Recibimos un Cease & Desistist

### Pasos a seguir
1. **NO ignores el C&D** — responde dentro del plazo
2. **Consulta abogado** — especialista en IP de videojuegos
3. **Evalúa el claim** — ¿Es válido? ¿Qué específicamente viola?
4. **Responde profesionalmente** — reconoce o disputa con fundamentos
5. **Implementa cambios** si es necesario:
   - Renombrar elementos
   - Rediseñar assets conflictivos
   - Modificar mecánicas si son demasiado similares

### Líneas defensivas
- Documentación de proceso creativo original
- Registros de compra de assets/licencias
- Diferencias documentadas con GO2
- Trademark search previo (due diligence)

---

## 📚 Referencias Legales

### Casos relevantes de la industria
- **Tetris v. Xio**: Formas específicas sí son copyrightable
- **Spry Fox v. Lolapps**: "Clon" con mismo look/feel = infracción
- **DaVinci v. Ziko**: Mecánicas no protegidas, expresión sí

### Recursos educativos
- "Video Game Law" by Ross Dannenberg
- IGDA (International Game Developers Association) resources
- Game Attorney (consultoras especializadas)

---

## Resumen de Principios

| ✅ HACER | ❌ NO HACER |
|-----------|-------------|
| Inspirarte en mecánicas | Copiar código |
| Crear tus propios assets | Usar assets de GO2 |
| Escribir textos originales | Traducir descripciones de GO2 |
| Diseñar naves diferentes | Replicar diseños exactos |
| Usar nombres genéricos o propios | Usar "Galaxy Online" o variaciones |
| Documentar tu proceso creativo | Ignorar la propiedad intelectual ajena |
| Contratar artistas originales | Descargar "packs de GO2" |
| Citar influencias | Afirmar ser "el verdadero GO2" |

---

## Declaración de Intenciones

Este proyecto es una **obra original inspirada** en el género de estrategia espacial 4X, con referencia a la experiencia de juego proporcionada por títulos como Galaxy Online II, Stellaris, OGame, y otros juegos del género.

**No afiliado con**: IGG, Galaxy Online II, SuperGO2, o cualquier proyecto relacionado.

**No es**: Un clon, emulador, servidor privado, o continuación de GO2.

**Es**: Un juego independiente con mecánicas propias, arte original, y universo único.

---

*Última actualización: Mayo 2026*  
*Revisar trimestralmente o ante cambios significativos del proyecto*
