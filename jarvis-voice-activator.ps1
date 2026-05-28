# JARVIS Voice Activator - Final Version
# Arquitectura: Loop sincronico + cola thread-safe
# Soluciona: Register-ObjectEvent no puede abrir navegador

Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName System.Windows.Forms

# ============================================================
# CONFIG
# ============================================================
$JARVISDir    = "C:\JARVIS-AI"
$JARVISPort   = 3000
$MinConfidence = 0.45

# Cola sincronizada para comandos entre threads
$script:CommandQueue = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
$script:Running      = $true
$script:Processing   = $false

# ============================================================
# FUNCIONES
# ============================================================

function Speak([string]$Text) {
    Write-Host "[JARVIS] $Text" -ForegroundColor Cyan
    $script:Synth.Speak($Text)
}

function Is-JARVISRunning {
    try {
        $tcp = New-Object Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $JARVISPort)
        $tcp.Close()
        return $true
    } catch { return $false }
}

function Start-JARVIS {
    if (Is-JARVISRunning) {
        Speak "JARVIS ya esta online"
        Start-Process "http://localhost:$JARVISPort/dashboard/jarvis"
        return
    }
    if (-not (Test-Path "$JARVISDir\package.json")) {
        Speak "No encuentro JARVIS instalado"
        return
    }
    Speak "Iniciando JARVIS"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -Command cd '$JARVISDir'; npx next start -p $JARVISPort"
    $psi.WorkingDirectory = $JARVISDir
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null

    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep -Seconds 2
        if (Is-JARVISRunning) {
            Speak "JARVIS esta listo"
            Start-Process "http://localhost:$JARVISPort/dashboard/jarvis"
            return
        }
    }
    Speak "JARVIS esta tardando en iniciar"
}

function Stop-JARVIS {
    Speak "Deteniendo JARVIS"
    Get-NetTCPConnection -LocalPort $JARVISPort -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Speak "JARVIS detenido"
}

function Process-Command([string]$Text, [double]$Confidence) {
    Write-Host "PROCESANDO: '$Text' (confianza: $([math]::Round($Confidence*100))%)" -ForegroundColor Green

    if ($Text -match "apaga|detener|parar") {
        Stop-JARVIS
    }
    elseif ($Text -match "estado|status") {
        if (Is-JARVISRunning) {
            Speak "JARVIS esta online y funcionando"
        } else {
            Speak "JARVIS esta apagado"
        }
    }
    elseif ($Text -match "abrir|inicia|encender|prender") {
        Start-JARVIS
    }
    elseif ($Text -match "tienda|marketplace|shop") {
        if (Is-JARVISRunning) {
            Speak "Abriendo la tienda"
            Start-Process "http://localhost:$JARVISPort"
        } else {
            Speak "La tienda esta offline. Iniciando JARVIS primero"
            Start-JARVIS
        }
    }
    elseif ($Text -match "panel|dashboard|control") {
        if (Is-JARVISRunning) {
            Speak "Abriendo el panel de control"
            Start-Process "http://localhost:$JARVISPort/dashboard/jarvis"
        } else {
            Speak "Iniciando JARVIS primero"
            Start-JARVIS
        }
    }
    else {
        # Wake word sin comando especifico
        if (Is-JARVISRunning) {
            Speak "En que puedo ayudarte?"
            Start-Process "http://localhost:$JARVISPort/dashboard/jarvis"
        } else {
            Speak "JARVIS esta listo. Queres que inicie el sistema?"
        }
    }
}

# ============================================================
# INICIO
# ============================================================

try {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  JARVIS AI - Control por Voz" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Inicializar sintetizador de voz
    $script:Synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $script:Synth.Volume = 100
    $script:Synth.Rate = 1

    # Intentar seleccionar voz en espanol
    try {
        $esVoices = $script:Synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -match "es-" }
        if ($esVoices) {
            $script:Synth.SelectVoice($esVoices[0].VoiceInfo.Name)
        }
    } catch {}

    # Verificar microfono
    Write-Host "Verificando microfono..." -ForegroundColor Yellow
    $script:Recog = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $script:Recog.SetInputToDefaultAudioDevice()
    Write-Host "Microfono OK" -ForegroundColor Green
    Write-Host ""

    # Gramatica 1: Solo wake word
    $gb1 = New-Object System.Speech.Recognition.GrammarBuilder
    $w1 = New-Object System.Speech.Recognition.Choices
    $w1.Add("Hey JARVIS")
    $w1.Add("JARVIS")
    $w1.Add("OK JARVIS")
    $w1.Add("Hola JARVIS")
    $w1.Add("Oye JARVIS")
    $gb1.Append($w1)
    $g1 = New-Object System.Speech.Recognition.Grammar $gb1
    $script:Recog.LoadGrammar($g1)

    # Gramatica 2: Wake word + comando
    $gb2 = New-Object System.Speech.Recognition.GrammarBuilder
    $w2 = New-Object System.Speech.Recognition.Choices
    $w2.Add("Hey JARVIS")
    $w2.Add("JARVIS")
    $w2.Add("OK JARVIS")
    $w2.Add("Hola JARVIS")
    $gb2.Append($w2)
    $c2 = New-Object System.Speech.Recognition.Choices
    $c2.Add(" abrir")
    $c2.Add(" inicia")
    $c2.Add(" encender")
    $c2.Add(" prender")
    $c2.Add(" apaga")
    $c2.Add(" detener")
    $c2.Add(" parar")
    $c2.Add(" estado")
    $c2.Add(" status")
    $c2.Add(" tienda")
    $c2.Add(" marketplace")
    $c2.Add(" panel")
    $c2.Add(" dashboard")
    $c2.Add(" control")
    $gb2.Append($c2)
    $g2 = New-Object System.Speech.Recognition.Grammar $gb2
    $script:Recog.LoadGrammar($g2)

    # Icono en bandeja del sistema
    $script:Tray = New-Object System.Windows.Forms.NotifyIcon
    $script:Tray.Icon = [System.Drawing.SystemIcons]::Information
    $script:Tray.Text = "JARVIS - Escuchando (di 'Hey JARVIS')"
    $script:Tray.Visible = $true

    $menu = New-Object System.Windows.Forms.ContextMenuStrip
    $m1 = $menu.Items.Add("Abrir JARVIS")
    $m1.Add_Click({ Process-Command "abrir" 1.0 })
    $m2 = $menu.Items.Add("Iniciar JARVIS")
    $m2.Add_Click({ Process-Command "inicia" 1.0 })
    $m3 = $menu.Items.Add("Detener JARVIS")
    $m3.Add_Click({ Process-Command "apaga" 1.0 })
    $menu.Items.Add("-") | Out-Null
    $m4 = $menu.Items.Add("Salir")
    $m4.Add_Click({
        $script:Tray.Visible = $false
        $script:Running = $false
        [System.Windows.Forms.Application]::Exit()
    })
    $script:Tray.ContextMenuStrip = $menu

    $script:Tray.Add_Click({
        if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
            if (Is-JARVISRunning) {
                Start-Process "http://localhost:$JARVISPort/dashboard/jarvis"
            } else {
                Start-JARVIS
            }
        }
    })

    # Iniciar reconocimiento asincronico
    $script:Recog.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

    Speak "JARVIS activado. Di Hey JARVIS"

    Write-Host "ESCUCHANDO... Di 'Hey JARVIS'" -ForegroundColor Green
    Write-Host "Icono azul en la bandeja (cerca del reloj)" -ForegroundColor Gray
    Write-Host "Click derecho en el icono para mas opciones" -ForegroundColor Gray
    Write-Host "Para salir: click derecho en icono - Salir" -ForegroundColor DarkGray
    Write-Host "========================================" -ForegroundColor Cyan

    # Loop principal: procesa comandos de la cola
    # Este loop corre en el thread principal (mismo que el icono)
    # por eso Start-Process funciona correctamente
    while ($script:Running) {
        [System.Windows.Forms.Application]::DoEvents()

        # Verificar si hay comandos en la cola
        if ($script:CommandQueue.Count -gt 0 -and -not $script:Processing) {
            $script:Processing = $true
            $cmd = $script:CommandQueue[0]
            $script:CommandQueue.RemoveAt(0)

            Process-Command $cmd.Text $cmd.Confidence

            Start-Sleep -Milliseconds 500
            $script:Processing = $false
        }

        Start-Sleep -Milliseconds 100
    }

} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. Microfono no conectado o muteado" -ForegroundColor Yellow
    Write-Host "2. Windows Speech Recognition no instalado" -ForegroundColor Yellow
    Write-Host "3. Permisos de microfono bloqueados" -ForegroundColor Yellow
    Write-Host "4. JARVIS no esta instalado en C:\JARVIS-AI" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona ENTER para salir"
} finally {
    if ($script:Recog) {
        try { $script:Recog.RecognizeAsyncStop() } catch {}
        $script:Recog.Dispose()
    }
    if ($script:Synth) { $script:Synth.Dispose() }
    if ($script:Tray) { $script:Tray.Visible = $false }
}
