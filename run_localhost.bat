@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo FPI Localhost Launcher
echo Folder: %CD%
echo This uses http://127.0.0.1:8765/ when available.
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_localhost.ps1"
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo FPI localhost launcher failed. Review the output above.
echo If needed, close old python/http.server windows and double-click this file again.
exit /b 1
