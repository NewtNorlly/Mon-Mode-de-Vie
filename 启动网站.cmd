@echo off
setlocal
set "MMV_ROOT=%~dp0"
echo Starting Mon Mode de Vie...

:: Try 4174 first (4173 is reserved by stuck HTTP.SYS)
start "Mon Mode de Vie" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%MMV_ROOT%tools\serve-local.ps1" -Port 4174
powershell.exe -NoProfile -Command "Start-Sleep -Milliseconds 1200"
start "" "http://localhost:4174/"
endlocal
