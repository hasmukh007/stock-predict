@echo off
title StockPredict - Windows Setup Assistant
echo ====================================================
echo   StockPredict Windows Environment Setup & Checker
echo ====================================================
echo.

echo [1/4] Checking Node.js and NPM...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [MISSING] Node.js is not found! Please install Node.js LTS (v20+ or v22+) from https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node -v') do echo   Found Node: %%i
    for /f "tokens=*" %%i in ('npm -v') do echo   Found NPM:  %%i
)

echo.
echo [2/4] Checking PHP...
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo [MISSING] PHP is not found in PATH! Please install PHP 8.2+ and add to PATH.
    echo   See WINDOWS_SETUP.md for instructions.
) else (
    for /f "tokens=*" %%i in ('php -v ^| findstr /i "PHP 8"') do echo   Found PHP:  %%i
    
    echo   Checking PHP SQLite and cURL extensions...
    php -m | findstr /i "pdo_sqlite" >nul 2>nul
    if %errorlevel% neq 0 (
        echo   [WARNING] 'pdo_sqlite' is NOT enabled in php.ini.
    ) else (
        echo   [OK] pdo_sqlite is enabled.
    )
    
    php -m | findstr /i "curl" >nul 2>nul
    if %errorlevel% neq 0 (
        echo   [WARNING] 'curl' is NOT enabled in php.ini.
    ) else (
        echo   [OK] curl is enabled.
    )
)

echo.
echo [3/4] Installing Frontend Dependencies (npm install)...
cd /d "%~dp0frontend"
call npm install

echo.
echo [4/4] Verification complete!
echo.
echo To run StockPredict, double-click:
echo   - start-all.bat (Starts both Backend and Frontend)
echo.
pause
