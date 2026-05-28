# JARVIS Voice Activator v4 - Fixed
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

    # Gramatica 1: Solo wake word (Hey JARVIS, JARVIS, OK JARVIS)
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
    $m2 = $menu.Items.Add("Iniciar JARVIS")
    $m2.Add_Click({ Start-Process "http://localhost:3000" })
    $m3 = $menu.Items.Add("Detener JARVIS")
    $m3.Add_Click({ Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force })
    $menu.Items.Add("-") | Out-Null
    $m4 = $menu.Items.Add("Salir")
    $m4.Add_Click({ $tray.Visible = $false; [System.Windows.Forms.Application]::Exit() })
    $tray.ContextMenuStrip = $menu

    $tray.Add_Click({
        if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
            Start-Process "http://localhost:3000"
        }
    })

    # Evento reconocimiento
    $processing = $false
    $recog.SpeechRecognized += {
        param($sender, $e)
        if ($processing) { return }
        $processing = $true

        $text = $e.Result.Text
        $conf = $e.Result.Confidence

        Write-Host "ESCUCHADO: '$text' (conf: $([math]::Round($conf*100))%)" -ForegroundColor Green

        if ($conf -gt 0.60) {
            if ($text -match "apaga|detener") {
                Speak("Deteniendo JARVIS")
                Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
            }
            elseif ($text -match "estado") {
                try {
                    $tcp = New-Object Net.Sockets.TcpClient
                    $tcp.Connect("127.0.0.1", 3000)
                    $tcp.Close()
                    Speak("JARVIS esta online")
                } catch {
                    Speak("JARVIS esta apagado")
                }
            }
            elseif ($text -match "abrir|inicia") {
                Speak("Abriendo JARVIS")
                Start-Process "http://localhost:3000"
            }
            elseif ($text -match "tienda|marketplace") {
                Speak("Abriendo tienda")
                Start-Process "http://localhost:3000"
            }
            else {
                Speak("En que puedo ayudarte?")
                Start-Process "http://localhost:3000/dashboard/jarvis"
            }
        }

        Start-Sleep 2
        $processing = $false
    }

    $recog.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

    Write-Host ""
    Write-Host "ESCUCHANDO... Di 'Hey JARVIS'" -ForegroundColor Green
    Write-Host "Icono azul en bandeja del sistema" -ForegroundColor Gray
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
