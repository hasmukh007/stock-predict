@echo off
title StockPredict - Launcher
echo ====================================================
echo   Launching StockPredict (Backend + Frontend)...
echo ====================================================

start "StockPredict Backend" cmd /k "%~dp0start-backend.bat"
timeout /t 2 /nobreak >nul
start "StockPredict Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Both servers have been launched in separate windows!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:4200
echo.
