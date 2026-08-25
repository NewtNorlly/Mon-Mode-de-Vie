param([int]$Port = 4174)

$root = Split-Path $PSScriptRoot -Parent
$prefix = "http://localhost:$Port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
  ".js"="text/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8"
  ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"
  ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".ico"="image/x-icon"
  ".mp4"="video/mp4"; ".webm"="video/webm"; ".m4v"="video/x-m4v"
}

try {
  $l = [Net.HttpListener]::new()
  $l.Prefixes.Add($prefix)
  $l.Start()
  Write-Host "Mon Mode de Vie: $prefix" -ForegroundColor Green
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
      $fileLength = (Get-Item $path).Length
      $start = [int64]0
      $end = $fileLength - 1
      $isRange = $false
      $rangeHeader = $ctx.Request.Headers["Range"]
      if ($rangeHeader -and $rangeHeader -match '^bytes=(\d*)-(\d*)$') {
        if ($Matches[1]) { $start = [int64]$Matches[1] }
        if ($Matches[2]) { $end = [Math]::Min([int64]$Matches[2], $fileLength - 1) }
        if (-not $Matches[1] -and $Matches[2]) { $start = [Math]::Max([int64]0, $fileLength - [int64]$Matches[2]); $end = $fileLength - 1 }
        if ($start -gt $end -or $start -ge $fileLength) { $ctx.Response.StatusCode = 416; $ctx.Response.Headers["Content-Range"] = "bytes */$fileLength"; continue }
        $isRange = $true
      }
      $ctx.Response.StatusCode = if ($isRange) { 206 } else { 200 }
      $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers["Accept-Ranges"] = "bytes"
      if ($isRange) { $ctx.Response.Headers["Content-Range"] = "bytes $start-$end/$fileLength" }
      $ctx.Response.ContentLength64 = $end - $start + 1

      if ($ctx.Request.HttpMethod -ne "HEAD") {
        $fs = [IO.File]::OpenRead($path)
        try {
          $fs.Seek($start, [IO.SeekOrigin]::Begin) | Out-Null
          $remaining = $end - $start + 1
          $buffer = New-Object byte[] 65536
          while ($remaining -gt 0) {
            $read = $fs.Read($buffer, 0, [Math]::Min($buffer.Length, $remaining))
            if ($read -le 0) { break }
            $ctx.Response.OutputStream.Write($buffer, 0, $read)
            $remaining -= $read
          }
        } finally { $fs.Dispose() }
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
