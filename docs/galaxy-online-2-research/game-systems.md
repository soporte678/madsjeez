# Sistemas de Juego - Galaxy Online II

Documentación de sistemas basada en investigación. Inspiración para diseño propio.

---

## 1. Recursos

### Tipos de recursos principales
| Recurso | Uso principal | Producción |
|---------|---------------|------------|
| **Metal** | Construcción de edificios, naves | Minas planetarias |
| **He3 (Helio-3)** | Combustible para naves | Extractores de gas |
| **Gold/Créditos** | Comercio, comandantes, aceleración | Impuestos, comercio |
| **Tokens/Cupones** | Premium, items especiales | Eventos, compra |

### Recursos secundarios
- **Puntos de alianza**: Contribución y recompensas de alianza
- **Puntos de honor**: Rankings PvP
- **Materiales de instancia**: Drops específicos de misiones PvE

### Mecánicas de recursos
- Producción pasiva basada en edificios
- Almacenamiento limitado por silos/almacenes
- Consumo continuo (He3 para flotas estacionadas)
- Robo en combates PvP
- Comercio entre jugadores

---

## 2. Planetas

### Características planetarias
- **Slots de construcción**: Limitados, expansibles
- **Posición**: Coordenadas en galaxia (X, Y)
- **Tipo**: Determina bonificaciones de recursos
- **Nivel**: Mejora capacidades base

### Tipos de planetas (ejemplos)
| Tipo | Bonificación | Estrategia |
|------|--------------|------------|
| Rocoso | +Metal | Industrial |
| Gaseoso | +He3 | Militar |
| Habitable | +Población | Económico |
| Minero | ++Metal | Especializado |

### Gestión planetaria
- Construcción de edificios (cola con timers)
- Asignación de flotas defensivas
- Transferencia de recursos entre planetas propios
- Abandono/conquista

---

## 3. Edificios

### Categorías
1. **Recursos**: Minas, extractores, plantas de energía
2. **Militar**: Astilleros, fábricas de módulos, academias
3. **Científico**: Laboratorios de investigación
4. **Económico**: Comercio, almacenes, mercados
5. **Defensa**: Escudos, cañones planetarios

### Sistema de construcción
- Cada edificio tiene niveles (1-30+)
- Coste aumenta exponencialmente
- Tiempo de construcción aumenta con nivel
- Cola de construcción (1 a la vez inicialmente)
- Cancelación posible (reembolso parcial)

### Edificios clave
- **Centro de Comando**: Nivel máximo limita otros edificios
- **Astillero**: Construcción de naves
- **Centro de Investigación**: Desbloquea tecnologías
- **Academia**: Entrenamiento de comandantes

---

## 4. Investigación

### Árbol de tecnologías
| Rama | Enfoque |
|------|---------|
| Construcción | Edificios más baratos, más slots |
| Economía | Mejor producción de recursos |
| Militar | Mejores naves, más flotas |
| Navegación | Velocidad, alcance de flotas |
| Defensa | Escudos, armas planetarias |

### Características
- Tecnologías desbloquean edificios/naves/módulos
- Investigación consume recursos y tiempo
- Cola de investigación
- Algunas tecnologías requieren otras previas
- Bonus permanentes para el imperio

---

## 5. Naves

### Características base
- **Estructura**: HP/armadura
- **Ataque**: Daño base
- **Defensa**: Reducción de daño
- **Velocidad**: En combate y en mapa
- **Carga**: Capacidad de transporte
- **Consumo He3**: Coste operativo

### Tipos de naves
| Tipo | Rol | Características |
|------|-----|-----------------|
| **Fragata** | Exploración, barco barato | Rápida, poco HP, scout |
| **Crucero** | Combate equilibrado | Balanceado, versátil |
| **Acorazado** | Tanque | Alto HP, lento, escudo |
| **Portanaves** | Lanzaderas | Transporta cazas |
| **Caza** | DPS alto | Fragil, daño masivo |
| **Bombardero** | Anti-estructura | Daño a edificios |
| **Colonizador** | Expansión | Lento, crea planetas |
| **Comerciante** | Transporte | Alta carga, sin armas |

### Planos/Blueprints
- Naves avanzadas requieren planos
- Planos obtienen de instancias PvE, eventos
- Planos pueden tener rareza (común, raro, épico, legendario)
- Planos desbloquean variantes con stats diferentes

---

## 6. Flotas

### Formación
- Grilla de posiciones (3x3, 4x4, etc.)
- Cada slot puede contener naves
- Posición afecta targeting y supervivencia
- Formaciones guardables

### Comandantes
- Cada flota tiene 1 comandante
- Comandantes tienen stats y habilidades
- Nivel de comandante por experiencia
- Comandantes equipan módulos

### Órdenes de flota
- **Atacar**: Combate PvP/PvE
- **Transportar**: Mover recursos
- **Colonizar**: Expandir imperio
- **Espionage**: Reconocimiento
- **Defender**: Apoyo a aliado
- **Piratería**: Interceptar transportes

### Gestión
- Múltiples flotas simultáneas (limitado por investigación)
- Flotas tienen velocidad base (la más lenta)
- Alcance limitado (investigación lo amplía)

---

## 7. Comandantes

### Stats principales
- **Táctica**: Bonus a daño
- **Mecánica**: Bonus a HP/estructura
- **Navegación**: Bonus a velocidad
- **Comercio**: Bonus a comercio

### Habilidades
- Pasivas (siempre activas)
- Activas (cooldown, efecto especial)
- Específicas por tipo de comandante

### Tipos
| Tipo | Especialización |
|------|-----------------|
| Mariscal | Combate ofensivo |
| Defensor | Combate defensivo |
| Ingeniero | Reparación, economía |
| Explorador | Velocidad, espionaje |
| Comerciante | Trade, recursos |

### Progresión
- Nivel 1-100 (o más)
- Experiencia por batallas
- Subida de nivel mejora stats base
- Cada X niveles: punto de habilidad

---

## 8. Módulos

### Tipos de módulos
| Tipo | Función |
|------|---------|
| **Armas** | Daño adicional, tipos de daño |
| **Defensa** | Escudos, armadura |
| **Motor** | Velocidad, evasión |
| **Estructura** | HP, resistencia |
| **Especiales** | Habilidades únicas |

### Sistema de equipamiento
- Slots limitados por nave/comandante
- Slots tienen categorías (arma pequeña/grande, etc.)
- Módulos crafteables con materiales
- Módulos de instancia son mejores

### Ejemplos de efectos
- +Daño láser
- +Ignorar escudos
- +Crit chance
- +Evasión
- Daño en área

---

## 9. Combate

### Fases del combate
1. **Aproximación**: Flotas se acercan según velocidad
2. **Intercambio**: Rondas de ataque
3. **Desenlace**: Victoria/derrota/retirada

### Sistema de turnos
- Por defecto: 1 ronda = 1 turno por flota
- Stats de velocidad determinan orden
- Comandantes pueden alterar orden

### Targeting
- Por defecto: objetivo más cercano
- Algunos módulos permiten elegir prioridad
- Formación afecta quién recibe daño primero

### Resultados
- Victoria: recursos, puntos, exp
- Derrota: pérdida de naves
- Empate: ambos se retiran
- Reporte detallado ronda por ronda

---

## 10. Misiones PvE (Instancias)

### Estructura
- **Niveles de dificultad**: 1-10 (o más)
- **Requisitos**: Poder mínimo de flota
- **Consumo**: He3, intentos diarios
- **Recompensas**: Planos, materiales, exp

### Tipos de instancias
| Tipo | Descripción |
|------|-------------|
| Normal | Combate estándar contra IA |
| Jefe | Enemigo único poderoso |
| Torneo | Múltiples rondas |
| Especial | Eventos temporales |
| Aliada | Coop con aliados |

### Diseño de instancia
- Olas de enemigos (waves)
- Composición predefinida
- IA con patrones simples
- Reward scaling con dificultad

---

## 11. Alianzas

### Estructura
- Miembro → Oficial → Líder
- Capacidad limitada de miembros
- Recursos compartidos (opcional)

### Características
- **Chat de alianza**
- **Tecnología de alianza**: Bonus compartidos
- **Ayuda mutua**: Acelerar construcciones
- **Guerras**: Alianza vs alianza
- **Eventos**: Competencias entre alianzas

### Contribución
- Puntos de contribución por ayudar
- Tienda de alianza con items exclusivos
- Rango en alianza por contribución

---

## 12. Eventos

### Tipos de eventos
| Tipo | Descripción |
|------|-------------|
| **Temporada** | Evento largo (meses), progresión |
| **Semanal** | Rotativo, objetivos variados |
| **Flash** | Corto, 24-48h, recompensas altas |
| **Aniversario** | Celebración, regalos |
| **PvP** | Torneos, rankings |

### Sistema de progresión
- Puntos de evento por acciones
- Milestones con recompensas
- Leaderboards
- Pass gratis/premium

---

## 13. Economía

### Fuentes de ingreso
- Producción planetaria (pasiva)
- Comercio (venta de recursos)
- Instancias PvE (intermitente)
| Raid PvP (alto riesgo)
- Eventos (temporal)

### Fuentes de gasto
- Construcción edificios
- Investigación
- Construcción naves
- Mantenimiento flotas (He3)
- Comandantes (salarios)
- Aceleraciones (pagar para skip timers)

### Comercio
- Mercado entre jugadores
- Ofertas de compra/venta
- Impuestos sobre transacciones
- Órdenes limitadas por nivel

---

## 14. Progresión del Jugador

### Nivel de comandante/jugador
- XP por: construir, investigar, combatir
- Niveles desbloquean features
- Puntos de habilidad por nivel

### Logros/Medallas
- Sistema de logros por hitos
- Bonus permanentes por completar
- Display en perfil público

### Renombre/Prestigio
- Sistema end-game de reinicio
- Prestigio → bonus permanentes
- Rankings globales

---

## 15. Timers y Energía

### Sistema de timers
- Construcción: X segundos/horas/días
- Investigación: similares
- Viaje: distancia / velocidad
- Aceleración: pago premium

### Limitadores
- **Energía/Acciones**: X acciones por día
- **Intentos PvE**: 3-5 por día
- **Flotas**: límite simultáneo
- **Planetas**: límite por imperio

### Monetización balanceada
- Skip timers (no pay-to-win directo)
- Recursos (intercambio justo)
- Items cosméticos
- Boosts temporales (no permanentes)

---

## Síntesis para diseño propio

### Core loops a mantener
1. Login → Recolectar recursos → Construir/Investigar
2. Preparar flota → Enviar a instancia/PvP
3. Esperar resultado → Analizar reporte
4. Mejorar flota → Repetir

### Diferenciación propuesta
- Sistema de combate más táctico
- Narrativa/Lore propio
- Visual moderno (3D WebGL/Three.js)
- Sistema de alianzas más profundo
- Eventos narrativos dinámicos
