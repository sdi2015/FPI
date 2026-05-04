$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "============================================================"
Write-Host "FPI Localhost Launcher"
Write-Host "Folder: $PWD"
Write-Host "URL:    http://localhost:8080/"
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
Write-Host "Opening browser and starting server on http://localhost:8080/"
Write-Host "Leave this window open while using FPI. Press Ctrl+C to stop."
Write-Host ""
Start-Process "http://localhost:8080/"
python -m http.server 8080
