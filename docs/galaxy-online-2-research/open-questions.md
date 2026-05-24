# Preguntas Abiertas - Investigación Pendiente

Dudas y decisiones pendientes para resolver antes/durante el MVP.

---

## 1. Mecánicas No Confirmadas

### Sistema de Combate
- [ ] **¿Cómo funciona exactamente el targeting en GO2?**
  - Prioridad por distancia vs tipo vs HP
  - Influencia de módulos de targeting
  - Fuentes: Wikis bloqueadas, preguntar en comunidad

- [ ] **¿Los comandantes pueden morir permanentemente?**
  - Algunos juegos similares tienen permadeath
  - Impacta balance económico
  - Decisión de producto pendiente

- [ ] **¿El escudo se regenera durante la batalla?**
  - Cada ronda, cada X rondas, nunca
  - Afecta fórmulas de daño

### Economía
- [ ] **¿Cuál era el ratio exacto de consumo He3?**
  - No encontrado en fuentes públicas
  - Necesitamos diseñar nuestra propia fórmula
  - Depende de balance que queramos

- [ ] **¿Había límite de almacenamiento o overflow?**
  - Algunos juegos descartan exceso
  - Otros pausan producción
  - Decisión de diseño pendiente

### Progresión
- [ ] **¿Cómo funcionaba exactamente el prestigio/renombre?**
  - Reinicio completo o parcial
  - Qué se conservaba
  - Fuentes incompletas

---

## 2. Datos que Faltan

### De fuentes bloqueadas
| Dato | Fuente | Estado | Alternativa |
|------|--------|--------|-------------|
| Stats exactos de naves | Fandom Wiki | 403 Forbidden | Diseñar propios balanceados |
| Fórmulas de investigación | Fandom Wiki | 403 Forbidden | Crear árbol propio |
| Recompensas de instancias | Fandom Wiki | 403 Forbidden | Diseñar desde cero |
| Composición exacta de olas PvE | KrTools limitado | Parcial | Crear propias |

### De comunidad
- [ ] **¿Cuáles eran los comandantes más usados y por qué?**
  - Meta histórico de GO2
  - Contactar comunidad SuperGO2 Discord
  
- [ ] **¿Qué features extrañan más los ex-jugadores?**
  - Encuesta informal posible
  - Priorizar en roadmap

---

## 3. Sistemas con Poca Información

### Módulos
- Información muy dispersa
- KrTools muestra slots pero no efectos exactos
- **Decisión**: Diseñar sistema propio simplificado para MVP

### Alianzas - Guerra
- Estructura básica documentada
- Detalles de guerra entre alianzas no claros
- **Decisión**: Post-MVP, diseñar sistema propio

### Eventos Temporales
- Solo mencionados en investigación
- Ningún detalle de implementación
- **Decisión**: No incluir en MVP

---

## 4. Fórmulas que Debemos Diseñar Propias

### Combate (MVP v0)
```typescript
// TODO: Validar y refinar
const damageFormula = {
  baseDamage: attacker.attack * quantity,
  defenseReduction: target.defense / (target.defense + 100),
  finalDamage: baseDamage * (1 - defenseReduction) * randomFactor,
  // Necesitamos: valores base de ataque/defensa para cada tipo de nave
};
```

### Economía (MVP v0)
```typescript
// TODO: Determinar ratios
const resourceProduction = {
  metalPerHour: base * (1 + buildingLevel * 0.1) * researchBonus,
  // Necesitamos: valores base balanceados
};
```

### Experiencia (MVP v0)
```typescript
// TODO: Curva de XP
const xpCurve = {
  level1: 100,
  level2: 250,
  level3: 500,
  // Necesitamos: curva que incentive sin ser frustrante
};
```

---

## 5. Riesgos Legales por Confirmar

| Tema | Riesgo | Acción |
|------|--------|--------|
| Nombre "Galaxy Online III" | Medio | Buscar trademark existente en USPTO |
| Mecánicas de formación 4x4 | Bajo | Mecánicas no protegibles |
| Concepto de "instancias PvE" | Bajo | Término genérico |
| Stats similares a GO2 | Medio | Cambiar nombres y valores exactos |
| Fórmulas idénticas | Alto | Diseñar fórmulas propias |

### Acciones pendientes
- [ ] Trademark search en USPTO para nombre
- [ ] Consulta legal sobre uso de "inspirado en"
- [ ] Verificar que no estemos usando datos de ingeniería inversa

---

## 6. Fuentes Bloqueadas o Incompletas

### Wikis Fandom (403 Forbidden)
- `galaxyonlineii.fandom.com`
- `galaxyonline2.fandom.com/es/`

**Alternativas intentadas:**
- Wayback Machine: Algunas páginas archivadas parcialmente
- SuperGO2 Discord: Comunidad activa, posible preguntar
- YouTube gameplay: Observación visual

### KrTools
- Funcional pero limitado (ship designer funciona)
- No muestra fórmulas, solo interfaz

---

## 7. Decisiones de Producto Pendientes

### MVP v0 - Scope

| Feature | Incluir | Prioridad | Notas |
|---------|---------|-----------|-------|
| 2x2 formación | ✅ | Alta | Simplificar de 4x4 para MVP |
| 3 tipos de naves | ✅ | Alta | Fragata, Crucero, Acorazado |
| Comandantes | ❌ | Media | Post-MVP, agrega complejidad |
| Módulos | ❌ | Media | Post-MVP |
| Alianzas | ❌ | Baja | Fase 2 |
| PvP real | ❌ | Baja | Fase 2 |
| Mercado | ❌ | Media | Fase 2 |
| Eventos | ❌ | Baja | Fase 3 |

### Monetización
- [ ] **¿Incluir compras en MVP?**
  - Opción A: No, enfocar en retención
  - Opción B: Sí, solo cosméticos/aceleración
  - Decisión post-prueba de concepto

### Plataformas
- [ ] **¿Mobile nativo desde inicio?**
  - Web responsive primero (menor costo)
  - React Native post-validación
  - Decide: validar en web primero

---

## 8. Preguntas Técnicas

### Arquitectura
- [ ] **¿WebSockets desde MVP o polling?**
  - WebSockets: Mejor UX, más complejidad
  - Polling: Más simple, suficiente para MVP
  - **Tendencia**: Polling para MVP, WS para Fase 2

- [ ] **¿Simulador de combate en cliente o solo servidor?**
  - Cliente: Preview rápida, riesgo de exploit
  - Servidor: Seguro, requiere backend
  - **Decisión**: Solo servidor para MVP (seguridad)

### Base de Datos
- [ ] **¿Soft deletes o hard deletes?**
  - Soft: Mejor para analytics, más complejo
  - Hard: Más simple, datos perdidos
  - **Tendencia**: Soft deletes para todo

---

## 9. Próximos Pasos para Resolver

### Corto plazo (antes de MVP)
1. [ ] Diseñar fórmulas de combate propias (con valores de prueba)
2. [ ] Definir curva de XP simple
3. [ ] Confirmar nombre legalmente disponible
4. [ ] Decidir si comandadores en MVP v0 o v1

### Mediano plazo (durante MVP)
1. [ ] Unirse a Discord SuperGO2, hacer preguntas específicas
2. [ ] Crear encuesta para ex-jugadores
3. [ ] Testear fórmulas con datos reales
4. [ ] Documentar decisiones tomadas

---

## 10. Supuestos que Estamos Haciendo

> Estos son "verdades temporales" que podemos cambiar:

1. **Asumimos**: El core loop de GO2 es divertido y queremos replicarlo
2. **Asumimos**: El público objetivo son ex-jugadores de GO2 + nuevos
3. **Asumimos**: Web primero, mobile después es estrategia válida
4. **Asumimos**: 3 tipos de naves son suficientes para MVP
5. **Asumimos**: Combate async es aceptable (no requiere jugador presente)

**Si alguna falla**, pivotar según feedback.

---

## Resumen de Prioridades

| Prioridad | Tema | Acción |
|-----------|------|--------|
| 🔴 Alta | Fórmulas de combate MVP | Diseñar y testear |
| 🔴 Alta | Nombre legal | Verificar trademark |
| 🟡 Media | Datos de naves | Diseñar propios |
| 🟡 Media | Scope MVP | Confirmar con agente |
| 🟢 Baja | Fuentes bloqueadas | Buscar alternativas |
| 🟢 Baja | Features post-MVP | Documentar para después |

---

*Actualizado: Mayo 2026*  
*Revisar semanalmente durante desarrollo MVP*
