@echo off
title Atlas Desktop Agent
cd /d "%~dp0"

echo [Atlas] Liberando puerto 8787...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8787" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

if not exist .env (
  echo [Atlas] Creando .env desde .env.example...
  copy .env.example .env >nul
  echo.
  echo IMPORTANTE: Editá .env y poné JARVIS_DESKTOP_SECRET=mi-atlas-2026-secreto
  echo (mismo valor que en Railway)
  pause
  notepad .env
)

echo [Atlas] Iniciando agente...
start "Atlas Voice" cmd /c "timeout /t 3 /nobreak >nul && start http://127.0.0.1:8787/voice?secret=mi-atlas-2026-secreto"
npm run dev
