param([int]$Port = 4174)

$root = Split-Path $PSScriptRoot -Parent
$prefix = "http://localhost:$Port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
  ".js"="text/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8"
  ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"
  ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".ico"="image/x-icon"
}

try {
  $l = [Net.HttpListener]::new()
  $l.Prefixes.Add($prefix)
  $l.Start()
  Write-Host "Mon Mode de Vie  →  $prefix" -ForegroundColor Green
  Write-Host "Press Ctrl+C to stop."

  while ($l.IsListening) {
    $ctx = $l.GetContext()
    try {
      $ctx.Response.KeepAlive = $false
      $ctx.Response.Headers["Cache-Control"] = "no-cache, no-store"

      if ($ctx.Request.HttpMethod -notin @("GET","HEAD")) { $ctx.Response.StatusCode = 405; continue }

      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/").Replace("/","\")
      if ($rel -eq "") { $rel = "index.html" }
      $path = Join-Path $root $rel

      if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { $ctx.Response.StatusCode = 403; continue }
      if ((Get-Item $path -Force -ErrorAction SilentlyContinue) -is [IO.DirectoryInfo]) { $path = Join-Path $path "index.html" }
      if (-not (Test-Path $path)) { $ctx.Response.StatusCode = 404; continue }

      $ext = [IO.Path]::GetExtension($path).ToLower()
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
      $ctx.Response.ContentLength64 = (Get-Item $path).Length

      if ($ctx.Request.HttpMethod -ne "HEAD") {
        $fs = [IO.File]::OpenRead($path)
        try { $fs.CopyTo($ctx.Response.OutputStream) } finally { $fs.Dispose() }
      }
    } catch { Write-Warning $_.Exception.Message } finally {
      try { $ctx.Response.OutputStream.Close() } catch {}
      try { $ctx.Response.Close() } catch {}
    }
  }
} finally {
  if ($l.IsListening) { $l.Stop() }
  $l.Close()
}
