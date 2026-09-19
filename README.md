# 📈 StockPredict - Stock Market Analysis & Prediction Platform

A full-featured, institutional-grade stock market analysis and forecasting platform tailored for Indian Equity Markets (NSE/BSE). The platform combines real-time financial market data, automated quantitative technical indicators, community sentiment, trading holiday calendars, automated price alerts, and an administrative moderation panel.

---

## 🏗️ 1. Architecture & How It Works

The platform is designed as a decoupled, high-performance client-server architecture:

```
 ┌────────────────────────────────────────────────────────┐
 │                   Angular 20 Frontend                  │
 │ (Chart.js, Signals / RxJS Services, Glassmorphic UI)   │
 └──────────────────────────┬─────────────────────────────┘
                            │ HTTP (Bearer JWT / REST JSON)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                    PHP REST Engine                     │
 │ [index.php] Router & CORS Gateway                      │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌──────────────────────────┐  ┌──────────────────────────┐
 │  YahooFinanceService.php │  │ TechnicalAnalysisService │
 │  - Real-time v8 quotes   │  │  - SMA (20, 50, 200), EMA│
 │  - 60s file-based cache  │  │  - RSI(14) Momentum      │
 │  - NSE (.NS) & BSE (.BO) │  │  - MACD (12, 26, 9)      │
 │  - Fallback simulation   │  │  - Bollinger Bands(20,2) │
 └─────────────┬────────────┘  │  - Support & Resistance  │
               │               │  - Scoring / Verdict     │
               │               └────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌────────────────────────────────────────────────────────┐
 │             SQLite 3 Database (WAL Mode)               │
 │  Users, Stocks, Analyses, News, Reminders, Holidays    │
 └────────────────────────────────────────────────────────┘
```

### ⚙️ Under The Hood
1. **Frontend**: Built with **Angular 20** standalone components and reactive architecture. It features a modern dark-mode glassmorphic interface, interactive financial charting via **Chart.js**, and client-side route guards.
2. **Backend**: Powered by a zero-dependency **PHP 8.2+ REST Engine**. It implements custom JWT (HS256) authentication, clean REST routing, and robust CORS handling.
3. **Data Ingestion**: The backend queries Yahoo Finance v8 Chart API for real-time and historical price candles across Indian equity symbols (supporting `.NS` for NSE and `.BO` for BSE).
4. **Caching & Resilience**: Market responses are cached locally for 60 seconds (`backend/data/cache/`) to eliminate external latency and rate limits. If external APIs are unavailable or network access is restricted, an internal realistic price simulation model seamlessly takes over.
5. **Persistence**: Embedded **SQLite 3** operating in **WAL (Write-Ahead Logging)** mode for zero-configuration, concurrent, and ACID-compliant storage. Tables and demo data are auto-seeded on initial run.

---

## 🌟 2. Project Features Breakdown

### 🅰️ Frontend Project (`/frontend`)

- **Interactive Ticker Tape & Market Portal (`/`)**:
  - Live animated market ticker streaming prices for major Indian indices (NIFTY 50, SENSEX, BANK NIFTY) and key blue-chip equities.
  - Curated Indian financial market news feed with visual sentiment badges (Bullish / Bearish).
  - Public analyst predictions feed showcasing community research.
  - Indian equity trading holiday calendar widget.
- **Stock Analyzer & Prediction Suite (`/analyzer`)**:
  - Instant symbol search across NSE & BSE equities.
  - Multi-timeframe historical inspection (`1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`).
  - Interactive Chart.js charts with moving average overlays and volume sub-charts.
  - Automated quantitative indicator readings (RSI, MACD, Bollinger Bands, Moving Averages, Support & Resistance).
  - Algorithmic consensus prediction verdict (`STRONG_BUY`, `BUY`, `NEUTRAL`, `SELL`, `STRONG_SELL`) with confidence gauge and target price.
  - Save analysis directly to personal dossier with custom research notes.
- **Side-by-Side Equities Comparator (`/compare`)**:
  - Compare two equities simultaneously on a unified timeline.
  - Relative performance metrics: 52-week High/Low, daily range spread, RSI spread, and volume ratios.
- **Personal Portfolio Dossier (`/history`)**:
  - Searchable, filterable archive of all saved user analyses.
  - Track target prices, entry prices, timeframe expectations, and indicator records.
- **Automated Price Alerts & Reminders (`/reminders`)**:
  - Set triggers for target price thresholds (trigger when price goes **above** or **below**).
  - Live tracking status (`ACTIVE` vs `TRIGGERED` with exact timestamp).
- **Administrative Control Panel (`/admin`)**:
  - Stock symbol management: toggle whether any stock is enabled or disabled for analysis platform-wide.
  - Add newly listed companies and symbols to the system.
  - Moderate public research posts: toggle home page visibility or promote to "Featured".
- **Authentication & User Management**:
  - Glassmorphic modal for seamless Sign In and Sign Up without page reloads.
  - Persistent session management with role-based UI access control.

---

### 🐘 Backend Project (`/backend`)

- **REST API Gateway (`index.php`)**:
  - Centralized request router mapping `/api/{resource}` endpoints.
  - Full CORS preflight support (`OPTIONS`, `GET`, `POST`, `PUT`, `DELETE`).
  - Health check endpoint (`/api/health`).
- **Quantitative Technical Analysis Service (`TechnicalAnalysisService.php`)**:
  - **Moving Averages**: 20-day SMA, 50-day SMA, 200-day SMA, and 20-day EMA.
  - **Momentum (RSI 14)**: Identifies oversold ($<30$) and overbought ($>70$) conditions.
  - **Trend Divergence (MACD)**: 12-day fast EMA, 26-day slow EMA, 9-day signal line, and MACD histogram.
  - **Volatility (Bollinger Bands)**: 20-period moving average with $\pm 2$ standard deviation envelopes.
  - **Support & Resistance**: Dynamic pivot clustering derived from historical price extremes.
  - **Algorithmic Consensus Scoring**: Multi-factor scoring engine (0 to 100) determining market posture and price projections.
- **Live Market Feed Engine (`YahooFinanceService.php`)**:
  - Live data retrieval for Indian equities (`.NS` and `.BO` suffix handling).
  - High-speed 60-second JSON file caching.
  - Built-in Brownian motion market simulation fallback.
- **Automated Database Management (`database.php`)**:
  - SQLite auto-initialization and schema migration.
  - Auto-seeds 6 core tables: `users`, `stocks`, `analyses`, `news`, `holidays`, `reminders`.
  - Auto-seeds demo accounts and Indian equities directory.
- **Native JWT Auth Helper (`jwt.php`)**:
  - Lightweight, dependency-free HMAC-SHA256 token encoding and verification.

---

## 🧠 3. How the Prediction Engine Works

When a user triggers an analysis:
1. **Historical Ingestion**: OHLCV candles (Open, High, Low, Close, Volume) are fetched for the selected period.
2. **Indicator Computation**:
   - **RSI (14)**: Measures velocity and magnitude of directional price movements.
   - **Moving Average Alignment**: Evaluates if the asset is in a Golden Alignment (Price $>$ 20 SMA $>$ 50 SMA).
   - **MACD Histogram**: Detects acceleration or deceleration in bullish/bearish momentum.
   - **Bollinger Bands**: Evaluates mean-reversion probabilities when price touches outer bands.
3. **Scoring Model**:
   - Base score initializes at **50 (Neutral)**.
   - Oversold RSI adds $+15$, overbought subtracts $-15$.
   - Positive MACD histogram adds $+8$, negative subtracts $-8$.
   - Price above 20 SMA adds $+8$, price above 50 SMA adds $+10$.
   - Band bounce triggers add/subtract $+7$/$-7$.
   - Normalised to a 0–100 scale.
4. **Recommendation Verdict**:
   - $\ge 78$: **`STRONG_BUY`**
   - $62 - 77$: **`BUY`**
   - $42 - 61$: **`NEUTRAL`**
   - $28 - 41$: **`SELL`**
   - $< 28$: **`STRONG_SELL`**
5. **Projected Target Price**: Computes recommended short-term target price aligned with volatility and verdict direction.

---

## 💻 4. Installation & Setup

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

## 🔐 5. Default Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stockpredict.com` | `Admin@123` | Full access + Admin Dashboard (manage symbols, moderate community feed). |
| **Senior Trader** | `trader@stockpredict.com` | `Trader@123` | Full access to Analyzer, personal dossier, and price alerts. |
| **Quant Analyst** | `sarah@stockpredict.com` | `Trader@123` | Full access to Analyzer, Comparator, and research notes. |

*(You can also click **Sign Up** on the frontend to create a new personal account).*

---

## 📖 6. User Guide: How to Use the Platform

### 1. Market Dashboard (`/`)
- Browse the real-time top ticker tape.
- Review latest Indian market headlines with bullish/bearish indicators.
- Check the Indian stock market holiday countdown.

### 2. Analyze a Stock (`/analyzer`)
1. Log in using any demo account or your registered account.
2. Choose a quick-select chip (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, etc.) or enter any ticker symbol in the search input.
3. Switch time intervals (`1M`, `3M`, `6M`, `1Y`) to inspect trends.
4. Review the computed technical indicators, recommendation verdict, confidence score, and projected target price.
5. Add your personal research notes and click **Save to Portfolio Dossier**.

### 3. Compare Two Stocks (`/compare`)
1. Select Stock A and Stock B.
2. View comparative normalized price curves on the Chart.js graph.
3. Contrast key valuation metrics, 52-week extremes, RSI momentum, and trading volume.

### 4. Create Price Alerts (`/reminders`)
1. Navigate to the **Reminders** tab.
2. Enter a stock symbol (e.g., `TCS`) and a target price (e.g., `4200`).
3. Choose the alert condition: **Price goes ABOVE** or **Price goes BELOW**.
4. The backend checks active reminders against live quotes and automatically marks triggered alerts with timestamps.

### 5. Admin Governance (`/admin`)
*(Available when logged in as `admin@stockpredict.com`)*
- **Stocks Management**: Enable or disable any stock from being analyzed platform-wide, or add custom listed stocks.
- **Feed Moderation**: Toggle user analyses to show/hide them from the public homepage or pin them as "Featured".

---

## 🔌 7. REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health-check & system status | No |
| `POST` | `/api/auth?action=login` | User login & JWT issuance | No |
| `POST` | `/api/auth?action=register` | New user registration | No |
| `GET` | `/api/stocks?action=list` | List all registered stocks | No |
| `GET` | `/api/analysis?action=fetch_and_analyze&symbol={SYM}&range={RANGE}` | Fetch live quotes & run technical prediction | Yes |
| `POST` | `/api/analysis?action=save` | Save analysis to portfolio dossier | Yes |
| `GET` | `/api/analysis?action=history` | Fetch logged-in user's saved analyses | Yes |
| `GET` | `/api/analysis?action=home_featured` | Public community analysis feed | No |
| `GET` | `/api/news` | Market news and sentiment analysis | No |
| `GET` | `/api/holidays` | Trading holidays calendar | No |
| `GET` | `/api/reminders?action=list` | User's active & triggered price reminders | Yes |
| `POST` | `/api/reminders?action=create` | Create a new price reminder | Yes |
| `POST` | `/api/admin?action=toggle_stock` | Enable/disable stock symbol | Admin |
| `POST` | `/api/admin?action=add_stock` | Register a new stock symbol | Admin |
