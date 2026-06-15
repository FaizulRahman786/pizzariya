# PowerShell Static HTTP Server for Pizzariya Town Template
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1
# Serves on http://localhost:8080

$port = 10000
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.gif'  = 'image/gif'
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $urlPath = $req.Url.AbsolutePath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }

        $filePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $res.StatusCode = 404
            $res.ContentType = 'text/plain'
            $res.ContentLength64 = $msg.Length
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }

        $res.OutputStream.Close()
        Write-Host "[$($res.StatusCode)] $urlPath" -ForegroundColor $(if ($res.StatusCode -eq 200) {'Cyan'} else {'Red'})
    } catch {
        # Handle listener stopping gracefully
        if ($listener.IsListening) {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
}
