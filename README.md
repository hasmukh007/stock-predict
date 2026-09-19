# 📈 StockPredict - Stock Market Analysis & Prediction Platform

A full-featured stock market analysis and forecasting platform tailored for the Indian Equity Markets (NSE/BSE), featuring interactive technical charts, automated signal indicators, real-time community sentiment, holiday calendars, price alerts, and an administrative control panel.

---

## 🛠 Tech Stack

- **Frontend**: [Angular 20](https://angular.dev/) (Standalone Components, Chart.js, Lucide Icons, Modern Glassmorphism CSS)
- **Backend**: Native PHP 8.2+ REST Engine (PDO SQLite, cURL, Custom Lightweight JWT, Yahoo Finance v8 API integration)
- **Database**: SQLite 3 (Zero configuration, stored in `backend/data/stock_predict.db`)

---

## 💻 Installation & Setup

### 🪟 Windows Setup (Fresh PC)
For a complete step-by-step guide with 1-click Winget commands and troubleshooting for a clean Windows machine, see:
👉 **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)**

Quick start on Windows:
1. Run `install-windows.bat` to verify environment and install npm packages.
2. Run `start-all.bat` to launch both Backend and Frontend servers.

---

### 🐧 macOS / Linux Setup

#### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS (`node -v`, `npm -v`)
- **PHP**: 8.2+ with `pdo_sqlite` and `curl` extensions (`php -v`)

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 3. Start Backend
```bash
cd backend
php -S 127.0.0.1:8000 index.php
```

#### 4. Start Frontend
```bash
cd frontend
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your web browser.

---

## 🔐 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@stockpredict.com` | `Admin@123` |
| **Senior Trader** | `trader@stockpredict.com` | `Trader@123` |
| **Quant Analyst** | `sarah@stockpredict.com` | `Trader@123` |
