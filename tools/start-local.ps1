$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

# 稳健地定位可用的 Python（跳过 Microsoft Store 的空壳 python）
$python = $null
$cmd = Get-Command python.exe -ErrorAction SilentlyContinue
if ($cmd -and $cmd.Source -notmatch 'WindowsApps') {
  $python = $cmd.Source
} else {
  foreach ($p in @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "$env:APPDATA\uv\python"
  )) {
    if ($p -and (Test-Path $p)) { $python = $p; break }
  }
  if (-not $python) {
    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) { $python = $py.Source }
  }
}
if (-not $python -or -not (Test-Path $python)) {
  Write-Host "未找到可用的 Python，请先安装 Python 3 并加入 PATH。" -ForegroundColor Red
  Write-Host "可运行：winget install Python.Python.3.11" -ForegroundColor Yellow
  throw "Python is required to start the local preview."
}

# 选择空闲端口
$usedPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort -Unique
$port = 4174..4194 | Where-Object { $_ -notin $usedPorts } | Select-Object -First 1
if (-not $port) { throw "4174-4194 之间没有可用端口。" }

$url = "http://127.0.0.1:$port/"
Write-Host "正在启动 Mon Mode de Vie ..." -ForegroundColor Cyan

# 先启动服务器（后台），等它就绪后再打开浏览器
$server = Start-Process -FilePath $python -ArgumentList @("-m", "http.server", "$port", "--bind", "127.0.0.1") -WorkingDirectory $root -PassThru -WindowStyle Hidden

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 300
  try {
    $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 1
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
}
if ($ready) {
  Write-Host "服务已就绪：$url" -ForegroundColor Green
  Start-Process $url
} else {
  Write-Host "服务器启动超时，请检查端口或防火墙。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按 Ctrl+C 或直接关闭本窗口即可停止服务。" -ForegroundColor DarkGray
# 保持前台运行，方便用户看到日志与停止
try { $server.WaitForExit() } catch { }
