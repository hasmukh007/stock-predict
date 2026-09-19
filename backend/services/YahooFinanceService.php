<?php
// backend/services/YahooFinanceService.php

class YahooFinanceService {
    private static string $cacheDir = __DIR__ . '/../data/cache';

    public static function getStockData(string $symbol, string $range = '3mo', string $interval = '1d'): array {
        $symbol = strtoupper(trim($symbol));
        if (empty($symbol)) {
            throw new InvalidArgumentException('Stock symbol cannot be empty.');
        }

        // Normalize range parameter for Yahoo Finance
        $rangeMap = [
            '1D' => '1d',
            '5D' => '5d',
            '1M' => '1mo',
            '1MO' => '1mo',
            '3M' => '3mo',
            '3MO' => '3mo',
            '6M' => '6mo',
            '6MO' => '6mo',
            '1Y' => '1y',
            '2Y' => '2y',
            '5Y' => '5y',
            'YTD' => 'ytd',
            'MAX' => 'max'
        ];
        $range = $rangeMap[strtoupper($range)] ?? '3mo';

        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0777, true);
        }

        $cacheFile = self::$cacheDir . '/' . md5($symbol . '_' . $range . '_' . $interval) . '.json';
        $cacheTtl = 60; // 1 minute cache for fresh live prices

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if ($cached && !empty($cached['is_live'])) {
                $cached['is_cached'] = true;
                return $cached;
            }
        }

        // Symbol Aliases and Exchange mappings for Indian Stocks
        $querySymbols = [];
        if ($symbol === 'TATAMOTORS') {
            $querySymbols = ['TMPV.NS', 'TMCV.NS', 'TATAMOTORS.NS', 'TATAMOTORS.BO'];
        } elseif ($symbol === 'NIFTY' || $symbol === 'NIFTY50') {
            $querySymbols = ['^NSEI'];
        } elseif ($symbol === 'SENSEX') {
            $querySymbols = ['^BSESN'];
        } elseif ($symbol === 'BANKNIFTY') {
            $querySymbols = ['^NSEBANK'];
        } elseif ($symbol === 'NIFTYIT') {
            $querySymbols = ['^CNXIT'];
        } elseif (!str_contains($symbol, '.') && !str_starts_with($symbol, '^')) {
            $querySymbols[] = "{$symbol}.NS";
            $querySymbols[] = "{$symbol}.BO";
            $querySymbols[] = $symbol;
        } else {
            $querySymbols[] = $symbol;
        }

        foreach ($querySymbols as $qSym) {
            $data = self::fetchFromYahoo($qSym, $range, $interval, $symbol);
            if ($data) {
                file_put_contents($cacheFile, json_encode($data));
                return $data;
            }
        }

        // Fallback to updated realistic simulation engine if Yahoo is completely inaccessible
        $fallbackData = self::generateFallbackData($symbol, $range);
        return $fallbackData;
    }

    private static function fetchFromYahoo(string $querySymbol, string $range, string $interval, string $originalSymbol): ?array {
        // Query hosts: query2 is fast, reliable, and avoids 429 rate limits
        $hosts = [
            'https://query2.finance.yahoo.com',
            'https://query1.finance.yahoo.com'
        ];

        foreach ($hosts as $host) {
            $url = "{$host}/v8/finance/chart/" . urlencode($querySymbol) . "?range={$range}&interval={$interval}&includePrePost=false";

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 6,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept: */*',
                    'Accept-Language: en-US,en;q=0.9',
                    'Origin: https://finance.yahoo.com',
                    'Referer: https://finance.yahoo.com/'
                ],
                CURLOPT_SSL_VERIFYPEER => false
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($httpCode === 200 && !empty($response)) {
                $json = json_decode($response, true);
                if (isset($json['chart']['result'][0])) {
                    $result = $json['chart']['result'][0];
                    $meta = $result['meta'] ?? [];
                    $timestamps = $result['timestamp'] ?? [];
                    $indicators = $result['indicators']['quote'][0] ?? [];

                    $opens = $indicators['open'] ?? [];
                    $highs = $indicators['high'] ?? [];
                    $lows = $indicators['low'] ?? [];
                    $closes = $indicators['close'] ?? [];
                    $volumes = $indicators['volume'] ?? [];

                    $history = [];
                    $validCloses = [];

                    for ($i = 0; $i < count($timestamps); $i++) {
                        $c = $closes[$i] ?? null;
                        if ($c === null) continue;

                        $o = $opens[$i] ?? $c;
                        $h = $highs[$i] ?? max($o, $c);
                        $l = $lows[$i] ?? min($o, $c);
                        $v = $volumes[$i] ?? 500000;

                        $validCloses[] = round($c, 2);
                        $history[] = [
                            'timestamp' => $timestamps[$i],
                            'date' => date('Y-m-d', $timestamps[$i]),
                            'open' => round($o, 2),
                            'high' => round($h, 2),
                            'low' => round($l, 2),
                            'close' => round($c, 2),
                            'volume' => (int)$v
                        ];
                    }

                    // Extract actual live price from meta or latest trade
                    $currentPrice = isset($meta['regularMarketPrice']) && is_numeric($meta['regularMarketPrice'])
                        ? (float)$meta['regularMarketPrice']
                        : (end($validCloses) ?: 1000.0);

                    $previousClose = isset($meta['regularMarketPreviousClose']) && is_numeric($meta['regularMarketPreviousClose'])
                        ? (float)$meta['regularMarketPreviousClose']
                        : (isset($meta['chartPreviousClose']) && is_numeric($meta['chartPreviousClose'])
                            ? (float)$meta['chartPreviousClose']
                            : (isset($meta['previousClose']) && is_numeric($meta['previousClose'])
                                ? (float)$meta['previousClose']
                                : (count($validCloses) >= 2 ? $validCloses[count($validCloses) - 2] : $currentPrice)));

                    $change = round($currentPrice - $previousClose, 2);
                    $changePercent = $previousClose > 0 
                        ? round(($change / $previousClose) * 100, 2) 
                        : (isset($meta['regularMarketChangePercent']) ? round((float)$meta['regularMarketChangePercent'], 2) : 0.0);

                    $allHighs = array_column($history, 'high');
                    $allLows = array_column($history, 'low');

                    $dayHigh = isset($meta['regularMarketDayHigh']) && is_numeric($meta['regularMarketDayHigh'])
                        ? (float)$meta['regularMarketDayHigh']
                        : (!empty($allHighs) ? max($allHighs) : $currentPrice);

                    $dayLow = isset($meta['regularMarketDayLow']) && is_numeric($meta['regularMarketDayLow'])
                        ? (float)$meta['regularMarketDayLow']
                        : (!empty($allLows) ? min($allLows) : $currentPrice);

                    $fiftyTwoHigh = isset($meta['fiftyTwoWeekHigh']) && is_numeric($meta['fiftyTwoWeekHigh'])
                        ? (float)$meta['fiftyTwoWeekHigh']
                        : (!empty($allHighs) ? max($allHighs) : round($currentPrice * 1.15, 2));

                    $fiftyTwoLow = isset($meta['fiftyTwoWeekLow']) && is_numeric($meta['fiftyTwoWeekLow'])
                        ? (float)$meta['fiftyTwoWeekLow']
                        : (!empty($allLows) ? min($allLows) : round($currentPrice * 0.85, 2));

                    $currency = $meta['currency'] ?? 'INR';
                    $exchange = ($meta['fullExchangeName'] ?? '') === 'BSE' || str_contains($querySymbol, '.BO') ? 'BSE' : 'NSE';

                    return [
                        'symbol' => $originalSymbol,
                        'full_symbol' => $querySymbol,
                        'name' => $meta['shortName'] ?? ($meta['longName'] ?? $originalSymbol),
                        'currency' => $currency,
                        'exchange' => $exchange,
                        'current_price' => round($currentPrice, 2),
                        'previous_close' => round($previousClose, 2),
                        'change' => $change,
                        'change_percent' => $changePercent,
                        'day_high' => round($dayHigh, 2),
                        'day_low' => round($dayLow, 2),
                        'fifty_two_week_high' => round($fiftyTwoHigh, 2),
                        'fifty_two_week_low' => round($fiftyTwoLow, 2),
                        'history' => $history,
                        'is_live' => true,
                        'source' => 'Yahoo Finance Real-Time API'
                    ];
                }
            }
        }

        return null;
    }

    private static function generateFallbackData(string $symbol, string $range): array {
        // Base realistic market prices in INR for prominent Indian equities
        $cleanSym = str_replace(['.NS', '.BO'], '', $symbol);
        $profiles = [
            'RELIANCE' => ['name' => 'Reliance Industries Ltd.', 'base' => 1226.40, 'exchange' => 'NSE', 'vol' => 0.015],
            'TCS' => ['name' => 'Tata Consultancy Services Ltd.', 'base' => 2105.00, 'exchange' => 'NSE', 'vol' => 0.014],
            'HDFCBANK' => ['name' => 'HDFC Bank Limited', 'base' => 731.00, 'exchange' => 'NSE', 'vol' => 0.012],
            'INFY' => ['name' => 'Infosys Limited', 'base' => 1051.40, 'exchange' => 'NSE', 'vol' => 0.016],
            'ICICIBANK' => ['name' => 'ICICI Bank Limited', 'base' => 1338.90, 'exchange' => 'NSE', 'vol' => 0.013],
            'TATAMOTORS' => ['name' => 'Tata Motors Passenger Vehicles Ltd.', 'base' => 303.80, 'exchange' => 'NSE', 'vol' => 0.022],
            'SBIN' => ['name' => 'State Bank of India', 'base' => 996.20, 'exchange' => 'NSE', 'vol' => 0.016],
            'BHARTIARTL' => ['name' => 'Bharti Airtel Limited', 'base' => 1893.30, 'exchange' => 'NSE', 'vol' => 0.015],
            'ITC' => ['name' => 'ITC Limited', 'base' => 262.30, 'exchange' => 'NSE', 'vol' => 0.011],
            'LT' => ['name' => 'Larsen & Toubro Limited', 'base' => 3885.00, 'exchange' => 'NSE', 'vol' => 0.014],
            'BAJFINANCE' => ['name' => 'Bajaj Finance Limited', 'base' => 1040.30, 'exchange' => 'NSE', 'vol' => 0.020],
            'WIPRO' => ['name' => 'Wipro Limited', 'base' => 166.83, 'exchange' => 'NSE', 'vol' => 0.017],
            'MARUTI' => ['name' => 'Maruti Suzuki India Ltd.', 'base' => 12103.00, 'exchange' => 'NSE', 'vol' => 0.015],
            'ZOMATO' => ['name' => 'Zomato Limited', 'base' => 265.50, 'exchange' => 'NSE', 'vol' => 0.028],
            'SUZLON' => ['name' => 'Suzlon Energy Limited', 'base' => 64.20, 'exchange' => 'NSE', 'vol' => 0.035],
        ];

        $prof = $profiles[$cleanSym] ?? [
            'name' => $cleanSym . ' Limited',
            'base' => 1000.00,
            'exchange' => 'NSE',
            'vol' => 0.018
        ];

        $days = 60;
        if ($range === '1mo') $days = 30;
        elseif ($range === '6mo') $days = 120;
        elseif ($range === '1y') $days = 250;

        $history = [];
        $price = $prof['base'] * 0.95;
        $now = time();
        $allHighs = [];
        $allLows = [];

        $seed = crc32($cleanSym . $range);
        mt_srand($seed);

        for ($i = $days; $i >= 0; $i--) {
            $dayTs = $now - ($i * 86400);
            $dayOfWeek = date('N', $dayTs);
            if ($dayOfWeek >= 6) continue;

            $changePct = (mt_rand(-120, 130) / 10000) * ($prof['vol'] * 50);
            $open = $price;
            $close = round($open * (1 + $changePct), 2);
            $high = round(max($open, $close) * (1 + (mt_rand(20, 100) / 10000)), 2);
            $low = round(min($open, $close) * (1 - (mt_rand(20, 100) / 10000)), 2);
            $vol = (int)(mt_rand(2500000, 18000000));

            $allHighs[] = $high;
            $allLows[] = $low;

            $history[] = [
                'timestamp' => $dayTs,
                'date' => date('Y-m-d', $dayTs),
                'open' => $open,
                'high' => $high,
                'low' => $low,
                'close' => $close,
                'volume' => $vol
            ];

            $price = $close;
        }

        $currentPrice = $price;
        $prevItem = count($history) >= 2 ? $history[count($history) - 2] : null;
        $prevClose = $prevItem ? $prevItem['close'] : ($currentPrice * 0.99);
        $change = round($currentPrice - $prevClose, 2);
        $changePercent = round(($change / $prevClose) * 100, 2);

        return [
            'symbol' => $cleanSym,
            'name' => $prof['name'],
            'currency' => 'INR',
            'exchange' => $prof['exchange'],
            'current_price' => $currentPrice,
            'previous_close' => $prevClose,
            'change' => $change,
            'change_percent' => $changePercent,
            'day_high' => max($allHighs) ?: $currentPrice,
            'day_low' => min($allLows) ?: $currentPrice,
            'fifty_two_week_high' => round(max($allHighs) * 1.08, 2),
            'fifty_two_week_low' => round(min($allLows) * 0.88, 2),
            'history' => $history,
            'is_live' => false,
            'source' => 'NSE Market Simulation Engine'
        ];
    }
}
