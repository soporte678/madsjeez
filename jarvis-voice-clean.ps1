# JARVIS Voice Activator v5 - Register-ObjectEvent
Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName System.Windows.Forms

try {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Volume = 100

    function Speak([string]$t) {
        Write-Host "[JARVIS] $t" -ForegroundColor Cyan
        $synth.Speak($t)
    }

    Write-Host "Verificando microfono..." -ForegroundColor Yellow
    $recog = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recog.SetInputToDefaultAudioDevice()
    Write-Host "Microfono OK" -ForegroundColor Green

    # Gramatica 1: Solo wake word
    $gb1 = New-Object System.Speech.Recognition.GrammarBuilder
    $w1 = New-Object System.Speech.Recognition.Choices
    $w1.Add("Hey JARVIS")
    $w1.Add("JARVIS")
    $w1.Add("OK JARVIS")
    $gb1.Append($w1)
    $g1 = New-Object System.Speech.Recognition.Grammar $gb1
    $recog.LoadGrammar($g1)

    # Gramatica 2: Wake word + comando
    $gb2 = New-Object System.Speech.Recognition.GrammarBuilder
    $w2 = New-Object System.Speech.Recognition.Choices
    $w2.Add("Hey JARVIS")
    $w2.Add("JARVIS")
    $w2.Add("OK JARVIS")
    $gb2.Append($w2)
    $c2 = New-Object System.Speech.Recognition.Choices
    $c2.Add(" inicia")
    $c2.Add(" abrir")
    $c2.Add(" apaga")
    $c2.Add(" detener")
    $c2.Add(" estado")
    $c2.Add(" tienda")
    $c2.Add(" marketplace")
    $gb2.Append($c2)
    $g2 = New-Object System.Speech.Recognition.Grammar $gb2
    $recog.LoadGrammar($g2)

    Speak("JARVIS activado. Di Hey JARVIS.")

    # Icono bandeja
    $tray = New-Object System.Windows.Forms.NotifyIcon
    $tray.Icon = [System.Drawing.SystemIcons]::Information
    $tray.Text = "JARVIS - Escuchando"
    $tray.Visible = $true

    $menu = New-Object System.Windows.Forms.ContextMenuStrip
    $m1 = $menu.Items.Add("Abrir JARVIS")
    $m1.Add_Click({ Start-Process "http://localhost:3000" })
    $m2 = $menu.Items.Add("Detener JARVIS")
    $m2.Add_Click({ Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force })
    $menu.Items.Add("-") | Out-Null
    $m3 = $menu.Items.Add("Salir")
    $m3.Add_Click({ 
        $tray.Visible = $false
        $recog.RecognizeAsyncStop()
        [System.Windows.Forms.Application]::Exit() 
    })
    $tray.ContextMenuStrip = $menu

    $tray.Add_Click({
        if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
            Start-Process "http://localhost:3000"
        }
    })

    # Variables para el evento (script scope)
    $script:VoiceProcessing = $false
    $script:VoiceSynth = $synth
    $script:VoiceTray = $tray

    # Evento usando Register-ObjectEvent (forma nativa de PowerShell)
    Register-ObjectEvent -InputObject $recog -EventName "SpeechRecognized" -Action {
        if ($script:VoiceProcessing) { return }
        $script:VoiceProcessing = $true

        $text = $EventArgs.Result.Text
        $conf = $EventArgs.Result.Confidence

        Write-Host "ESCUCHADO: '$text' (conf: $([math]::Round($conf*100))%)" -ForegroundColor Green

        if ($conf -gt 0.60) {
            if ($text -match "apaga|detener") {
                Write-Host "[JARVIS] Deteniendo JARVIS" -ForegroundColor Cyan
                $script:VoiceSynth.Speak("Deteniendo JARVIS")
                Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
            }
            elseif ($text -match "estado") {
                try {
                    $tcp = New-Object Net.Sockets.TcpClient
                    $tcp.Connect("127.0.0.1", 3000)
                    $tcp.Close()
                    Write-Host "[JARVIS] JARVIS esta online" -ForegroundColor Cyan
                    $script:VoiceSynth.Speak("JARVIS esta online")
                } catch {
                    Write-Host "[JARVIS] JARVIS esta apagado" -ForegroundColor Cyan
                    $script:VoiceSynth.Speak("JARVIS esta apagado")
                }
            }
            elseif ($text -match "abrir|inicia") {
                Write-Host "[JARVIS] Abriendo JARVIS" -ForegroundColor Cyan
                $script:VoiceSynth.Speak("Abriendo JARVIS")
                Start-Process "http://localhost:3000"
            }
            elseif ($text -match "tienda|marketplace") {
                Write-Host "[JARVIS] Abriendo tienda" -ForegroundColor Cyan
                $script:VoiceSynth.Speak("Abriendo tienda")
                Start-Process "http://localhost:3000"
            }
            else {
                Write-Host "[JARVIS] En que puedo ayudarte?" -ForegroundColor Cyan
                $script:VoiceSynth.Speak("En que puedo ayudarte?")
                Start-Process "http://localhost:3000/dashboard/jarvis"
            }
        }

        Start-Sleep 2
        $script:VoiceProcessing = $false
    } | Out-Null

    $recog.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

    Write-Host ""
    Write-Host "ESCUCHANDO... Di 'Hey JARVIS'" -ForegroundColor Green
    Write-Host "Icono azul en bandeja del sistema" -ForegroundColor Gray
    Write-Host "Click derecho en icono para mas opciones" -ForegroundColor Gray
    Write-Host ""

    [System.Windows.Forms.Application]::Run()

} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. Microfono no conectado o muteado" -ForegroundColor Yellow
    Write-Host "2. Windows Speech Recognition no instalado" -ForegroundColor Yellow
    Write-Host "3. Permisos de microfono bloqueados en Windows" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona ENTER para salir"
}
