# 📊 StockPredict - Comprehensive System Overview & Technical Manual

This document provides a deep dive into the features, system architecture, quantitative analysis engine, and usage workflows for both the **Frontend** and **Backend** applications.

---

## 📑 Table of Contents
1. [System Architecture](#-1-system-architecture)
2. [Frontend Application Details](#-2-frontend-application-details)
3. [Backend Engine Details](#-3-backend-engine-details)
4. [Quantitative Prediction Model](#-4-quantitative-prediction-model)
5. [End-to-End User Workflows](#-5-end-to-end-user-workflows)
6. [API & Service Specifications](#-6-api--service-specifications)
7. [Installation & Execution](#-7-installation--execution)

---

## 🏛️ 1. System Architecture

StockPredict uses a decoupled, event-driven Single-Page Application (SPA) communicating over a RESTful API with an embedded database:

```
┌────────────────────────────────────────────────────────┐
│               Angular 20 SPA (Frontend)                │
│  - Standalone Components & Route Guards                │
│  - Chart.js Candlestick & Line Multi-Axis Visuals      │
│  - Reactive Services with RxJS & Signals               │
│  - Glassmorphic Responsive CSS                         │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / REST (Bearer JWT Auth)
                           ▼
┌────────────────────────────────────────────────────────┐
│            Native PHP 8.2+ REST Gateway                │
│  - Fast URL Parsing & CORS Preflight Engine            │
│  - Custom HMAC-SHA256 JWT Token Validator              │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│   YahooFinanceService     │ │ TechnicalAnalysisService  │
│ - v8 REST API Integration │ │ - SMA (20, 50, 200) & EMA │
│ - 60s File Caching Engine │ │ - Momentum RSI (14)       │
│ - Indian Equities Mapping │ │ - MACD Line & Histogram   │
│ - Robust Fallback Sim     │ │ - Bollinger Bands (20, 2) │
└────────────┬──────────────┘ │ - Pivot Support/Resist    │
             │                │ - Confidence Score & Bias │
             │                └─────────────┬─────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite 3 Database (WAL Mode)               │
│   Tables: users, stocks, analyses, news, reminders,     │
│           holidays                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🅰️ 2. Frontend Application Details

### Technology Stack
- **Framework**: Angular 20 (Standalone Components, `inject()` syntax)
- **Visuals**: Chart.js 4.x
- **Icons**: Lucide Icons
- **Design System**: Tailored Glassmorphic Dark UI (pure CSS variables, backdrop blur)

### Key Pages & Modules

#### 1. Market Portal (`/`)
- **Ticker Tape**: Continuously animated bar displaying current prices and percentage changes for indices and blue chips (`NIFTY 50`, `SENSEX`, `RELIANCE`, `TCS`, `INFY`).
- **Market News**: Curated market headlines categorized into `Market`, `Economy`, `Earnings`, or `Tech`, with visual sentiment tags (`Bullish`, `Bearish`, `Neutral`).
- **Analyst Community Feed**: Real-time cards showing recently published stock analyses, verdicts, and target prices.
- **Holidays Widget**: Countdown to the next upcoming exchange market holiday with session details (full close vs early close).

#### 2. Stock Analyzer & Predictor (`/analyzer`)
- **Symbol Selection**: Quick-select chips for high-volume stocks plus live search input for any ticker.
- **Interactive Timeframes**: Granular range options: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`.
- **Chart Visualizer**: Dual-axis Chart.js canvas rendering historical price closes and overlaid moving averages.
- **Key Metrics Grid**: Live price, day change, daily high/low range, and 52-week extremes.
- **Quantitative Dashboard**: Direct readout of calculated indicators (RSI, MACD, Bollinger Bands, Support/Resistance).
- **Consensus Prediction Badge**: Large, color-coded verdict banner (`STRONG BUY`, `BUY`, `NEUTRAL`, `SELL`, `STRONG SELL`) with dynamic confidence percentage.
- **Portfolio Dossier Integration**: Save button allowing logged-in traders to save the current analysis, confidence, and target price directly to their private profile.

#### 3. Side-by-Side Equities Comparator (`/compare`)
- Multi-ticker comparison tool designed to contrast performance between industry rivals (e.g., `TCS` vs `INFY`, or `HDFCBANK` vs `ICICIBANK`).
- Synchronized multi-dataset graph highlighting relative momentum.
- Direct metric comparison table: 52-week range positioning, volume divergence, and RSI strength.

#### 4. Portfolio History (`/history`)
- Chronological table of all analyses previously saved by the authenticated user.
- View snapshot of indicators captured at the moment of analysis.
- Quick filter by recommendation verdict.

#### 5. Price Reminders & Automated Alerts (`/reminders`)
- Form to register automated price thresholds for any stock.
- Supports conditions: `When Price Rises Above Target` or `When Price Drops Below Target`.
- Background tracker updates reminder status to `TRIGGERED` as soon as market price crosses the barrier.

#### 6. Administration Console (`/admin`)
- Accessible exclusively by users with the `admin` role.
- **Symbol Governance**: Disable analysis for specific symbols or reactivate them.
- **Directory Addition**: Add newly listed equity symbols with custom sectors and exchange tags.
- **Community Moderation**: Toggle public homepage visibility on user submissions and pin standout research as "Featured".

---

## 🐘 3. Backend Engine Details

### Technology Stack
- **Runtime**: PHP 8.2+
- **Database**: SQLite 3 with WAL (Write-Ahead Logging) mode
- **Transport**: JSON REST over HTTP, CORS enabled
- **Authentication**: JWT HS256

### Services Architecture

#### `TechnicalAnalysisService.php`
A pure mathematical engine computing standard financial indicators:
- **Simple Moving Average (SMA)**: Computes arithmetic mean over specified rolling windows (20, 50, 200 periods).
- **Exponential Moving Average (EMA)**: Weighted average giving higher weight to recent prices using smoothing factor $k = \frac{2}{N + 1}$.
- **Relative Strength Index (RSI 14)**: Measures the ratio of average gains to average losses over 14 intervals.
- **Moving Average Convergence Divergence (MACD)**: 12-period EMA minus 26-period EMA, coupled with a 9-period signal line.
- **Bollinger Bands**: 20-period SMA middle band with upper and lower envelopes placed at $\pm 2$ standard deviations.
- **Support & Resistance**: Pivot point identification via local min/max clustering.

#### `YahooFinanceService.php`
- Connects to Yahoo Finance v8 Chart API endpoint.
- Maps plain Indian tickers (e.g. `RELIANCE`) to their exchange identifiers (`RELIANCE.NS` for NSE, `RELIANCE.BO` for BSE).
- Caches all live quotes on disk for 60 seconds (`backend/data/cache/`) to eliminate repetitive network round-trips.
- Includes automatic fallback simulation model ensuring continuous offline demo capability.

#### `database.php`
- Initializes the SQLite database file in `backend/data/stock_predict.db`.
- Sets `journal_mode = WAL` and `foreign_keys = ON`.
- Schema auto-creates:
  - `users`: ID, name, email, password hash, role (`admin` | `user`).
  - `stocks`: Symbol, company name, exchange (`NSE` | `BSE`), sector, allowed flag.
  - `analyses`: Saved user dossiers, indicator snapshots, target prices, visibility flags.
  - `news`: Financial market articles, sentiment tags, timestamps.
  - `holidays`: Exchange trading holiday schedule and special notes.
  - `reminders`: Price alert thresholds, conditions, triggered status.

---

## 📈 4. Quantitative Prediction Model

The platform does not rely on random numbers; it executes a multi-factor algorithmic scoring model:

$$\text{Base Score} = 50 \quad (\text{Neutral Baseline})$$

| Indicator Condition | Score Adjustment | Rationale |
| :--- | :---: | :--- |
| **Price $>$ 20-day SMA** | $+8$ | Short-term bullish trend |
| **Price $<$ 20-day SMA** | $-8$ | Short-term selling pressure |
| **Price $>$ 50-day SMA** | $+10$ | Intermediate trend support |
| **Price $<$ 50-day SMA** | $-10$ | Intermediate trend breakdown |
| **Golden Alignment (20 SMA $>$ 50 SMA)** | $+6$ | Moving average bullish momentum |
| **RSI(14) $<$ 30** | $+15$ | Oversold condition (mean-reversion bounce) |
| **RSI(14) $>$ 70** | $-15$ | Overbought condition (exhaustion risk) |
| **RSI(14) between 50 and 70** | $+5$ | Healthy accumulation zone |
| **MACD Histogram $>$ 0** | $+8$ | Positive momentum expansion |
| **MACD Histogram $<$ 0** | $-8$ | Bearish momentum divergence |
| **Price $\le$ Lower Bollinger Band** | $+7$ | High probability statistical bounce |
| **Price $\ge$ Upper Bollinger Band** | $-7$ | Resistance test / mean reversion |

### Verdict Thresholds
- **Score $\ge 78$**: `STRONG_BUY`
- **Score $62 - 77$**: `BUY`
- **Score $42 - 61$**: `NEUTRAL`
- **Score $28 - 41$**: `SELL`
- **Score $< 28$**: `STRONG_SELL`

---

## 👥 5. End-to-End User Workflows

### Scenario A: Researching and Saving an Equity Prediction
1. Navigate to `/analyzer`.
2. Click **RELIANCE** or type another symbol in the search bar.
3. Review the moving average curves and RSI reading.
4. Verify the algorithmic verdict (e.g. `BUY` with 74% confidence).
5. Enter custom notes: *"Accumulating on support bounce near 50-day SMA"*.
6. Click **Save to Portfolio Dossier**.
7. Visit `/history` to review your saved analysis with historical indicator snapshots.

### Scenario B: Setting a Volatility Price Alert
1. Navigate to `/reminders`.
2. Type symbol `TCS`, set target price to `4150.00`.
3. Select `Trigger when price goes ABOVE`.
4. Submit. The system will continuously monitor live market prices and transition the reminder to `TRIGGERED` as soon as the target is reached.

### Scenario C: Administrative Moderation
1. Sign in with `admin@stockpredict.com` / `Admin@123`.
2. Navigate to `/admin`.
3. Locate `SUZLON` in the stock directory and toggle its status to **Allowed** to enable platform users to analyze it.
4. View the Community Feed moderation table and click **Feature** on high-quality trader research to highlight it on the public home page.

---

## 🔑 Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@stockpredict.com` | `Admin@123` |
| **Senior Trader** | `trader@stockpredict.com` | `Trader@123` |
| **Quant Analyst** | `sarah@stockpredict.com` | `Trader@123` |
