<?php
// backend/config/database.php

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            $dbPath = __DIR__ . '/../data/stock_predict.db';
            $dbDir = dirname($dbPath);
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0777, true);
            }

            $isNew = !file_exists($dbPath);
            self::$pdo = new PDO('sqlite:' . $dbPath);
            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            // Enable WAL mode for high concurrency
            self::$pdo->exec('PRAGMA journal_mode = WAL;');
            self::$pdo->exec('PRAGMA foreign_keys = ON;');

            if ($isNew || filesize($dbPath) === 0) {
                self::initializeDatabase(self::$pdo);
            }
        }

        return self::$pdo;
    }

    private static function initializeDatabase(PDO $pdo): void {
        // 1. Users table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // 2. Allowed Stocks table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                exchange TEXT NOT NULL,
                sector TEXT NOT NULL,
                is_allowed INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // 3. Analyses table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                stock_name TEXT NOT NULL,
                current_price REAL NOT NULL,
                target_price REAL,
                timeframe TEXT NOT NULL DEFAULT '1M',
                indicators_json TEXT NOT NULL,
                verdict TEXT NOT NULL, -- STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
                confidence INTEGER NOT NULL DEFAULT 75,
                notes TEXT,
                is_featured INTEGER NOT NULL DEFAULT 0,
                is_visible_on_home INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        // 4. News table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'Market', -- Market, Tech, Economy, Earnings
                image_url TEXT,
                source TEXT NOT NULL DEFAULT 'MarketWire',
                is_published INTEGER NOT NULL DEFAULT 1,
                published_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // 5. Market Holidays table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS holidays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                holiday_date DATE NOT NULL,
                exchange TEXT NOT NULL DEFAULT 'NYSE/NASDAQ',
                status TEXT NOT NULL DEFAULT 'closed', -- 'closed', 'early_close'
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // 6. User Price Reminders table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                target_price REAL NOT NULL,
                condition TEXT NOT NULL DEFAULT 'above', -- 'above', 'below'
                is_triggered INTEGER NOT NULL DEFAULT 0,
                triggered_at DATETIME,
                is_active INTEGER NOT NULL DEFAULT 1,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        self::seedInitialData($pdo);
    }

    private static function seedInitialData(PDO $pdo): void {
        // Seed Users (Admin and Demo Trader)
        $adminPass = password_hash('Admin@123', PASSWORD_DEFAULT);
        $userPass = password_hash('Trader@123', PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
        $stmt->execute(['StockPredict Administrator', 'admin@stockpredict.com', $adminPass, 'admin']);
        $stmt->execute(['Alex Rivera (Senior Trader)', 'trader@stockpredict.com', $userPass, 'user']);
        $stmt->execute(['Sarah Chen (Quant Analyst)', 'sarah@stockpredict.com', $userPass, 'user']);

        // Seed Allowed Indian Stocks (NSE)
        $stocks = [
            ['RELIANCE', 'Reliance Industries Ltd.', 'NSE', 'Energy & Conglomerate', 1],
            ['TCS', 'Tata Consultancy Services Ltd.', 'NSE', 'Information Technology', 1],
            ['HDFCBANK', 'HDFC Bank Limited', 'NSE', 'Banking & Finance', 1],
            ['INFY', 'Infosys Limited', 'NSE', 'Information Technology', 1],
            ['ICICIBANK', 'ICICI Bank Limited', 'NSE', 'Banking & Finance', 1],
            ['TATAMOTORS', 'Tata Motors Limited', 'NSE', 'Automotive', 1],
            ['SBIN', 'State Bank of India', 'NSE', 'Banking (PSU)', 1],
            ['BHARTIARTL', 'Bharti Airtel Limited', 'NSE', 'Telecommunications', 1],
            ['ITC', 'ITC Limited', 'NSE', 'FMCG & Cigarettes', 1],
            ['LT', 'Larsen & Toubro Limited', 'NSE', 'Infrastructure & Capital Goods', 1],
            ['BAJFINANCE', 'Bajaj Finance Limited', 'NSE', 'Financial Services', 1],
            ['WIPRO', 'Wipro Limited', 'NSE', 'Information Technology', 1],
            ['ZOMATO', 'Zomato Limited', 'NSE', 'Consumer Internet', 1],
            ['SUZLON', 'Suzlon Energy Limited', 'NSE', 'Renewable Energy', 0] // disabled demo
        ];

        $stockStmt = $pdo->prepare("INSERT INTO stocks (symbol, name, exchange, sector, is_allowed) VALUES (?, ?, ?, ?, ?)");
        foreach ($stocks as $s) {
            $stockStmt->execute($s);
        }

        // Seed Indian Financial & Market News
        $news = [
            [
                'RBI Monetary Policy: Repo Rate Kept Steady at 6.5% Amid Resilient Indian GDP Growth',
                'The Reserve Bank of India MPC maintained key lending rates, pointing to favorable monsoon developments and steady core inflation trajectory.',
                'Governor highlighted robust domestic capital expenditure, healthy corporate balance sheets, and resilient foreign exchange reserves exceeding $680 billion. Banking equities rallied following the policy announcement.',
                'Economy',
                'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
                'Economic Times',
                1,
                date('Y-m-d H:i:s', strtotime('-2 hours'))
            ],
            [
                'Nifty IT Index Surges 2.6%: Large-Cap Tech Bluechips Gain on BFSI Deal Pipeline',
                'TCS and Infosys lead broad-based gains as international banking clients accelerate discretionary cloud migration and generative AI allocations.',
                'Management commentary from top tier-1 Indian software exporters suggests improving deal conversion velocity and solid margin resilience heading into the second half of fiscal 2026.',
                'Tech',
                'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
                'LiveMint Tech',
                1,
                date('Y-m-d H:i:s', strtotime('-5 hours'))
            ],
            [
                'India Auto Dispatches: EV and Premium SUV Segment Record Double-Digit Surge',
                'Tata Motors and Mahindra report robust wholesale dispatches as domestic retail demand remains buoyant ahead of the festive season.',
                'Commercial vehicle segment also witnessed steady volume pickup driven by government infrastructure allocations and fleet modernization programs across key freight corridors.',
                'Market',
                'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
                'Business Standard',
                1,
                date('Y-m-d H:i:s', strtotime('-12 hours'))
            ],
            [
                'Q2 Corporate Earnings Preview: FMCG and Private Banks Forecasted to Deliver Strong Margins',
                'Analysts project robust pre-provision operating profits for top private lenders alongside steady rural consumption revival for FMCG leaders.',
                'Key market watchers will closely monitor asset quality metrics, net interest margins (NIMs), and volume growth trajectories across domestic consumer segments.',
                'Earnings',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
                'Moneycontrol News',
                1,
                date('Y-m-d H:i:s', strtotime('-1 day'))
            ]
        ];

        $newsStmt = $pdo->prepare("INSERT INTO news (title, summary, content, category, image_url, source, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($news as $n) {
            $newsStmt->execute($n);
        }

        // Seed Official Indian Market Holidays (NSE & BSE 2026 Calendar)
        $holidays = [
            ['Mahashivratri', '2026-02-17', 'NSE/BSE', 'closed', 'National market holiday across Indian exchanges'],
            ['Holi', '2026-03-04', 'NSE/BSE', 'closed', 'Holi Festival equity and derivatives market closure'],
            ['Id-Ul-Fitr (Ramzan Id)', '2026-03-21', 'NSE/BSE', 'closed', 'National holiday on Id-Ul-Fitr'],
            ['Mahavir Jayanti', '2026-03-31', 'NSE/BSE', 'closed', 'Annual Mahavir Jayanti market holiday'],
            ['Good Friday', '2026-04-03', 'NSE/BSE', 'closed', 'Good Friday holiday across equity & currency segments'],
            ['Dr. Baba Saheb Ambedkar Jayanti', '2026-04-14', 'NSE/BSE', 'closed', 'National holiday in honor of Dr. B.R. Ambedkar'],
            ['Maharashtra Day', '2026-05-01', 'NSE/BSE', 'closed', 'Maharashtra State Day equity market break'],
            ['Independence Day', '2026-08-15', 'NSE/BSE', 'closed', 'National holiday celebrating 79th Indian Independence Day'],
            ['Ganesh Chaturthi', '2026-09-14', 'NSE/BSE', 'closed', 'Ganesh Chaturthi festival closure'],
            ['Mahatma Gandhi Jayanti', '2026-10-02', 'NSE/BSE', 'closed', 'National holiday honoring the Father of the Nation'],
            ['Dussehra (Vijay Dashami)', '2026-10-20', 'NSE/BSE', 'closed', 'Traditional Dussehra celebration closure'],
            ['Diwali (Laxmi Pujan - Muhurat Trading)', '2026-11-08', 'NSE/BSE', 'early_close', 'Special Auspicious Muhurat Trading Session (6:15 PM - 7:15 PM IST)'],
            ['Diwali Balipratipada', '2026-11-10', 'NSE/BSE', 'closed', 'Diwali Balipratipada market closure'],
            ['Gurunanak Jayanti', '2026-11-24', 'NSE/BSE', 'closed', 'Guru Nanak Jayanti national observance'],
            ['Christmas', '2026-12-25', 'NSE/BSE', 'closed', 'Christmas holiday closure']
        ];

        $holidayStmt = $pdo->prepare("INSERT INTO holidays (name, holiday_date, exchange, status, notes) VALUES (?, ?, ?, ?, ?)");
        foreach ($holidays as $h) {
            $holidayStmt->execute($h);
        }

        // Seed Sample Community Analyses in INR
        $analyses = [
            [
                2, // Alex Rivera
                'RELIANCE',
                'Reliance Industries Ltd.',
                2985.40,
                3350.00,
                '3M',
                json_encode([
                    'sma20' => 2920.80,
                    'sma50' => 2860.50,
                    'sma200' => 2640.00,
                    'rsi14' => 63.4,
                    'macd' => ['macd' => 28.50, 'signal' => 21.30, 'histogram' => 7.20],
                    'support' => 2880.00,
                    'resistance' => 3050.00,
                    'volume_vs_avg' => '+22.4%'
                ]),
                'STRONG_BUY',
                89,
                'Refining margins resilient and telecom ARPU expansion providing multi-quarter earnings tailwinds. Target set at ₹3,350 with stop-loss at ₹2,880.',
                1, // is_featured
                1  // is_visible_on_home
            ],
            [
                3, // Sarah Chen
                'TCS',
                'Tata Consultancy Services Ltd.',
                4290.50,
                4680.00,
                '1M',
                json_encode([
                    'sma20' => 4220.00,
                    'sma50' => 4140.00,
                    'sma200' => 3890.00,
                    'rsi14' => 59.2,
                    'macd' => ['macd' => 34.10, 'signal' => 28.00, 'histogram' => 6.10],
                    'support' => 4180.00,
                    'resistance' => 4380.00,
                    'volume_vs_avg' => '+11.5%'
                ]),
                'BUY',
                84,
                'Consistent contract renewals in North America and strong execution on multi-year AI transformation deals. Favorable risk-reward.',
                1,
                1
            ],
            [
                2, // Alex Rivera
                'HDFCBANK',
                'HDFC Bank Limited',
                1665.20,
                1850.00,
                '6M',
                json_encode([
                    'sma20' => 1640.10,
                    'sma50' => 1625.00,
                    'sma200' => 1560.00,
                    'rsi14' => 55.8,
                    'macd' => ['macd' => 12.40, 'signal' => 10.80, 'histogram' => 1.60],
                    'support' => 1610.00,
                    'resistance' => 1720.00,
                    'volume_vs_avg' => '+8.7%'
                ]),
                'BUY',
                81,
                'Credit-deposit ratio normalizing steadily with loan book growth stabilizing. Attractive valuation multiple compared to 5-year historical average.',
                0,
                1
            ],
            [
                3, // Sarah Chen
                'TATAMOTORS',
                'Tata Motors Limited',
                975.40,
                1120.00,
                '3M',
                json_encode([
                    'sma20' => 955.00,
                    'sma50' => 930.00,
                    'sma200' => 880.00,
                    'rsi14' => 66.1,
                    'macd' => ['macd' => 16.20, 'signal' => 12.50, 'histogram' => 3.70],
                    'support' => 920.00,
                    'resistance' => 1020.00,
                    'volume_vs_avg' => '+16.2%'
                ]),
                'STRONG_BUY',
                86,
                'JLR order book visibility and domestic electric vehicle market share retention support upside trajectory toward ₹1,120.',
                0,
                1
            ]
        ];

        $analysisStmt = $pdo->prepare("
            INSERT INTO analyses (user_id, symbol, stock_name, current_price, target_price, timeframe, indicators_json, verdict, confidence, notes, is_featured, is_visible_on_home)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($analyses as $a) {
            $analysisStmt->execute($a);
        }

        // Seed Sample Reminders in INR
        $reminders = [
            [2, 'RELIANCE', 3100.00, 'above', 0, null, 1, 'Alert when Reliance breaks out above ₹3,100 psychological resistance'],
            [2, 'HDFCBANK', 1600.00, 'below', 0, null, 1, 'Accumulate dip alert below ₹1,600']
        ];
        $reminderStmt = $pdo->prepare("INSERT INTO reminders (user_id, symbol, target_price, condition, is_triggered, triggered_at, is_active, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($reminders as $r) {
            $reminderStmt->execute($r);
        }
    }
}
