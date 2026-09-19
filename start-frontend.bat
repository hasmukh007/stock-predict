@echo off
title StockPredict - Frontend Server (Angular)
echo ====================================================
echo   StockPredict Angular 20 SPA Starting...
echo   Target: http://localhost:4200
echo ====================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js LTS (v20+ or v22+) from https://nodejs.org/
    echo Refer to WINDOWS_SETUP.md for detailed instructions.
    pause
    exit /b 1
)

cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo [INFO] node_modules folder not found. Running npm install first...
    call npm install
)

echo Starting Angular Dev Server on http://localhost:4200...
call npm start
pause
