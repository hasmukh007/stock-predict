# 🚀 StockPredict - Fresh Windows PC Setup & Installation Guide

This guide walks you through setting up and running **StockPredict** (Angular 20 Frontend + PHP SQLite Backend) on a clean, fresh Windows 10 or Windows 11 PC.

---

## 📋 Table of Contents
1. [Architecture & Prerequisites Overview](#-architecture--prerequisites-overview)
2. [Option A: Quick Setup (Using Windows Package Manager `winget`)](#-option-a-quick-setup-using-winget-recommended)
3. [Option B: Manual Installation (Step-by-Step)](#-option-b-manual-installation-step-by-step)
4. [PHP Configuration (`php.ini`)](#-php-configuration-crucial-step)
5. [Frontend Dependency Installation](#-frontend-dependency-installation)
6. [Starting the Application](#-starting-the-application)
7. [Default Demo Accounts & Credentials](#-default-demo-accounts--credentials)
8. [Convenience Scripts for Windows](#-convenience-scripts-for-windows)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏗 Architecture & Prerequisites Overview

- **Backend**: Native PHP 8.2+ with built-in SQLite (no separate database server needed)
  - Runs at: `http://127.0.0.1:8000`
  - Database: Auto-initialized at `backend/data/stock_predict.db`
- **Frontend**: Angular 20 Single Page Application (SPA)
  - Runs at: `http://localhost:4200`
  - Node.js LTS (v20.x or v22.x recommended)

---

## ⚡ Option A: Quick Setup (Using `winget` - Recommended)

Open **PowerShell as Administrator** (Right-click Start menu -> *Terminal (Admin)* or *PowerShell (Admin)*) and run:

```powershell
# 1. Install Git, Node.js LTS, and PHP 8.3 via Windows Package Manager
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id PHP.PHP.8.3 -e --source winget

# 2. Allow PowerShell script execution for Angular CLI (one-time setup)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

> **Note**: After installing, **close and reopen** your Terminal / Command Prompt so your system environment `PATH` refreshes.

---

## 🛠 Option B: Manual Installation (Step-by-Step)

If you prefer downloading official installers manually:

### 1. Install Git for Windows
1. Download Git from [https://git-scm.com/download/win](https://git-scm.com/download/win).
2. Run the installer with default options. Ensure *"Git from the command line and also from 3rd-party software"* is checked.

### 2. Install Node.js LTS
1. Download Node.js LTS installer (v20.x or v22.x) from [https://nodejs.org/](https://nodejs.org/).
2. Run the `.msi` installer and follow the setup wizard with default settings.
3. Verify in Command Prompt (`cmd`):
   ```cmd
   node -v
   npm -v
   ```

### 3. Install PHP 8.2+ or 8.3
You have two easy choices for PHP on Windows:

#### Choice 3.1: Standalone PHP Zip (Lightweight, ~30 MB)
1. Download **VS16 x64 Thread Safe** or **Non Thread Safe** Zip from [https://windows.php.net/download/](https://windows.php.net/download/).
2. Extract the archive to `C:\php`.
3. Add `C:\php` to your Windows System `PATH`:
   - Press <kbd>Win</kbd> + <kbd>R</kbd>, type `sysdm.cpl`, hit Enter.
   - Go to **Advanced** tab -> **Environment Variables**.
   - Under *System variables*, select **Path** -> click **Edit** -> **New** -> add `C:\php`.
   - Click **OK** on all dialogs.
4. Verify in a new Command Prompt window:
   ```cmd
   php -v
   ```

#### Choice 3.2: XAMPP / Laragon (All-in-one)
If you already use [XAMPP](https://www.apachefriends.org/) or [Laragon](https://laragon.org/), PHP is already included at `C:\xampp\php` or `C:\laragon\bin\php\php-8.x`. Just ensure that folder is in your `PATH`.

---

## ⚙️ PHP Configuration (Crucial Step!)

StockPredict requires SQLite and cURL for market data fetching. You must enable these extensions in PHP:

1. Open your PHP folder (e.g., `C:\php` or your PHP install path).
2. If `php.ini` doesn't exist, copy `php.ini-development` and rename it to `php.ini`.
3. Open `php.ini` in Notepad or VS Code and make sure the following lines are uncommented (remove the leading `;` semicolon):

```ini
; Set extension directory
extension_dir = "ext"

; Enable necessary extensions
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_sqlite
extension=sqlite3
```

4. Verify enabled extensions by running:
   ```cmd
   php -m
   ```
   *Ensure `curl`, `openssl`, and `pdo_sqlite` appear in the output list.*

---

## 📦 Frontend Dependency Installation

1. Open Command Prompt or PowerShell and navigate to the project directory:
   ```cmd
   cd C:\path\to\stock-predict\frontend
   ```

2. Install Node.js packages:
   ```cmd
   npm install
   ```

*(This will install Angular 20, Chart.js, RxJS, and all supporting packages).*

---

## ▶️ Starting the Application

StockPredict requires two processes running concurrently: the PHP REST API backend and the Angular development server.

### Terminal 1: Start Backend (PHP Server)
```cmd
cd C:\path\to\stock-predict\backend
php -S 127.0.0.1:8000 index.php
```
> ✅ You will see: `[Date] PHP 8.x.x Development Server (http://127.0.0.1:8000) started`  
> *Note: On first boot, the SQLite database `stock_predict.db` is created and seeded automatically.*

### Terminal 2: Start Frontend (Angular SPA)
```cmd
cd C:\path\to\stock-predict\frontend
npm start
```
> ✅ Once compilation completes, open your browser at:  
> 🌐 **[http://localhost:4200](http://localhost:4200)**

---

## 🔑 Default Demo Accounts & Credentials

The database comes pre-seeded with sample users and live market data:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stockpredict.com` | `Admin@123` | Full admin panel, stock allowlist control, publish news |
| **Senior Trader** | `trader@stockpredict.com` | `Trader@123` | Community analyses, custom price reminders, live charts |
| **Quant Analyst** | `sarah@stockpredict.com` | `Trader@123` | Technical indicators, chart analysis, community signals |

---

## 🖱️ Convenience Scripts for Windows

For convenience, double-clickable `.bat` helper scripts are included in the root folder:

- **`install-windows.bat`**: Runs initial prerequisite checks and runs `npm install`.
- **`start-backend.bat`**: Starts the PHP backend at `http://127.0.0.1:8000`.
- **`start-frontend.bat`**: Starts the Angular dev server at `http://localhost:4200`.
- **`start-all.bat`**: Opens two terminal windows and launches both simultaneously!

---

## ❓ Troubleshooting & FAQs

### 1. `ng : File ... cannot be loaded because running scripts is disabled on this system`
- **Cause**: Windows PowerShell security policy blocks script execution by default.
- **Fix**: Open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
  ```

### 2. `php is not recognized as an internal or external command`
- **Cause**: PHP directory is not in your system `PATH`.
- **Fix**: Add `C:\php` (or your PHP install folder) to Windows Environment Variables `Path`, then restart Command Prompt.

### 3. `could not find driver` or `SQLite3 database error`
- **Cause**: `pdo_sqlite` is not enabled in `php.ini`.
- **Fix**: Open `php.ini`, ensure `extension=pdo_sqlite` and `extension_dir = "ext"` are uncommented, then restart the PHP server.

### 4. `Port 8000 is already in use`
- **Fix**: Check what process is using port 8000:
  ```cmd
  netstat -ano | findstr :8000
  ```
  Or launch PHP on a different port if needed (remember to update `apiUrl` in `frontend/src/app/services/` if changing port).

### 5. Windows Defender Firewall Prompt
- If Windows Firewall asks for permission when running `php.exe` or `node.exe`, select **Allow access** for Private networks.

---

🎉 **You're all set!** Enjoy using StockPredict on Windows.
