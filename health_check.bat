@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo FPI Local App Health Check
echo Folder: %CD%
echo ============================================================
echo.

python scripts\validate_baseline.py || goto :error
python scripts\validate_seed.py || goto :error
python scoring\validate_scoring.py || goto :error
python orchestration\validate_orchestration.py || goto :error
node --check assets\app.js || goto :error

echo.
echo FPI local app health check passed.
echo Expected localhost URL after starting server: http://localhost:8080/
echo Expected app version: fpi-015
echo.
pause
exit /b 0

:error
echo.
echo FPI local app health check failed. Review output above.
pause
exit /b 1
