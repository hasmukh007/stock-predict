@echo off
title StockPredict - Backend Server (PHP)
echo ====================================================
echo   StockPredict PHP REST Engine Starting...
echo   Target: http://127.0.0.1:8000
echo ====================================================

where php >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not found in your system PATH!
    echo Please install PHP 8.2+ and add it to your Environment Variables.
    echo Refer to WINDOWS_SETUP.md for detailed instructions.
    pause
    exit /b 1
)

cd /d "%~dp0backend"
echo Starting PHP Development Server on 127.0.0.1:8000...
php -S 127.0.0.1:8000 index.php
pause
