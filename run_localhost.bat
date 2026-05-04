@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo FPI Localhost Launcher
echo Folder: %CD%
echo URL:    http://localhost:8080/
echo ============================================================
echo.

echo Running quick validation before starting localhost...
python scripts\validate_baseline.py || goto :error
python scripts\validate_seed.py || goto :error
python scoring\validate_scoring.py || goto :error
python orchestration\validate_orchestration.py || goto :error
node --check assets\app.js || goto :error

echo.
echo Validation passed.
echo Opening browser and starting server on http://localhost:8080/
echo Leave this window open while using FPI. Press Ctrl+C to stop.
echo.
start "" "http://localhost:8080/"
python -m http.server 8080
goto :eof

:error
echo.
echo FPI localhost validation failed. Review the output above.
echo This folder may be partially synced or missing dependencies.
pause
exit /b 1
