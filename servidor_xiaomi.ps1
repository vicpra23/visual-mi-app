# Servidor local ultra-ligero para Xiaomi Visual
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO SERVIDOR XIAOMI VISUAL" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

try {
    $listener.Start()
} catch {
    Write-Host "⚠️ El puerto 8080 está ocupado. Intentando con 8081..." -ForegroundColor Yellow
    $port = 8081
    $listener.Prefixes.Clear()
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

$targetUrl = "http://localhost:$port/index.html"
Write-Host "✅ ¡SERVICIO ACTIVO!" -ForegroundColor Green
Write-Host "🌐 URL: $targetUrl" -ForegroundColor Yellow
Write-Host "⛔ NO CIERRES ESTA VENTANA MIENTRAS USES LA APLICACIÓN." -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Cyan

# Lanzar el navegador predeterminado
Start-Process $targetUrl

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        
        $filePath = Join-Path -Path (Get-Location) -ChildPath $path.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                default { $response.ContentType = "application/octet-stream" }
            }
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 200 OK - $path" -ForegroundColor Gray
        } else {
            $response.StatusCode = 404
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 404 Not Found - $path" -ForegroundColor Red
        }
        $response.Close()
    } catch {
        Write-Host "Error manejando petición: $_" -ForegroundColor Red
    }
}
