@echo off
title JARVIS Control por Voz
color 0A
cls
echo ========================================
echo    JARVIS AI - Control por Voz
echo ========================================
echo.

:: Verificar que JARVIS esta instalado
if not exist "C:\JARVIS-AI\package.json" (
    echo [ERROR] JARVIS no esta instalado.
    echo Instala JARVIS primero.
    pause
    exit /b 1
)

echo [OK] JARVIS encontrado.
echo.
echo Iniciando control por voz...
echo Di "Hey JARVIS" para activar
echo.

:: Iniciar el activador de voz con STA (necesario para icono en bandeja)
powershell -STA -ExecutionPolicy Bypass -File "C:\JARVIS-AI\jarvis-voice-activator.ps1"
