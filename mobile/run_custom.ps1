$env:Path = "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:Path"
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$avdName = "Medium_Phone_API_36.1"

Write-Host "Verificando dispositivos..."
$devices = adb devices
if ($devices -match "device\s") {
    Write-Host "Dispositivo ya conectado."
}
else {
    Write-Host "Iniciando emulador $avdName..."
    Start-Process -FilePath $emulatorPath -ArgumentList "-avd $avdName" -NoNewWindow
    Write-Host "Esperando a que el emulador arranque (20s)..."
    Start-Sleep -Seconds 20
}

Write-Host "Iniciando build para Android..."
npx expo run:android
