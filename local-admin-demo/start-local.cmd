@echo off
setlocal
cd /d "%~dp0"
echo.
echo Starting Pizjo Admin Local Demo...
echo Open http://localhost:4173 in this computer's browser.
echo Press Ctrl+C in this window to stop the local demo.
node server.mjs
pause
