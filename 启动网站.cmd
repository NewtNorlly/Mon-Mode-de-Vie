@echo off
setlocal
set "MMV_ROOT=%~dp0"
echo Starting Mon Mode de Vie...

start "Mon Mode de Vie" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%MMV_ROOT%tools\start-local.ps1"
endlocal
