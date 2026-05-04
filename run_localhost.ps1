$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Test-FpiUrl {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
        return ($response.StatusCode -eq 200 -and
            $response.Content.Contains("FPI Program Console") -and
            $response.Content.Contains("assets/app.js?v=fpi-region75"))
    }
    catch {
        return $false
    }
}

function Test-PortListening {
    param([int]$Port)
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    return $null -ne $listener
}

Write-Host "============================================================"
Write-Host "FPI Localhost Launcher"
Write-Host "Folder: $PWD"
Write-Host "Preferred URL: http://127.0.0.1:8765/"
Write-Host "============================================================"
Write-Host ""

Write-Host "Running quick validation before starting localhost..."
python scripts/validate_baseline.py
python scripts/validate_seed.py
python scoring/validate_scoring.py
python orchestration/validate_orchestration.py
node --check assets/app.js

Write-Host ""
Write-Host "Validation passed."

$port = 8765
$url = "http://127.0.0.1:$port/"

if (Test-FpiUrl -Url $url) {
    Write-Host "FPI is already running at $url"
    Start-Process $url
    exit 0
}

if (Test-PortListening -Port $port) {
    Write-Host "Port $port is already in use by something else. Finding an open fallback port..."
    $port = 8766
    while ((Test-PortListening -Port $port) -and $port -lt 8780) {
        $port++
    }
    if ($port -ge 8780) {
        throw "No open localhost port found between 8766 and 8779. Close old local servers and try again."
    }
    $url = "http://127.0.0.1:$port/"
}

Write-Host "Starting FPI server on $url"
$serverCommand = "Set-Location -LiteralPath '$PSScriptRoot'; Write-Host 'Serving FPI from:' (Get-Location); Write-Host 'Open $url'; python -m http.server $port --bind 127.0.0.1"
Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $serverCommand

$ready = $false
for ($attempt = 1; $attempt -le 20; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-FpiUrl -Url $url) {
        $ready = $true
        break
    }
}

if (-not $ready) {
    throw "FPI server did not become ready at $url. Check the new server window for errors."
}

Write-Host "FPI server is ready: $url"
Start-Process $url
Write-Host "Browser opened. Leave the FPI server window open while using FPI."
