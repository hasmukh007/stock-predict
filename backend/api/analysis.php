<?php
// backend/api/analysis.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../services/YahooFinanceService.php';
require_once __DIR__ . '/../services/TechnicalAnalysisService.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'home_featured';
$pdo = Database::getConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'fetch_and_analyze':
        // Require logged-in user for running new analyses
        $user = AuthHelper::requireAuth();

        $symbol = strtoupper(trim($_GET['symbol'] ?? ($input['symbol'] ?? '')));
        $range = trim($_GET['range'] ?? ($input['range'] ?? '3mo'));

        if (empty($symbol)) {
            http_response_code(400);
            echo json_encode(['error' => 'Stock symbol is required.']);
            exit;
        }

        // Check if stock is allowed by administrator
        $stmt = $pdo->prepare("SELECT * FROM stocks WHERE symbol = ?");
        $stmt->execute([$symbol]);
        $stock = $stmt->fetch();

        if ($stock && (int)$stock['is_allowed'] === 0) {
            http_response_code(403);
            echo json_encode([
                'error' => "Symbol '{$symbol}' is currently disabled for analysis by the system administrator.",
                'is_restricted' => true
            ]);
            exit;
        }

        try {
            $stockData = YahooFinanceService::getStockData($symbol, $range);
            $analysisResult = TechnicalAnalysisService::analyze($stockData);

            echo json_encode([
                'success' => true,
                'stock' => [
                    'symbol' => $stockData['symbol'],
                    'name' => $stock ? $stock['name'] : $stockData['name'],
                    'exchange' => $stock ? $stock['exchange'] : $stockData['exchange'],
                    'sector' => $stock ? $stock['sector'] : 'Equities',
                    'current_price' => $stockData['current_price'],
                    'previous_close' => $stockData['previous_close'],
                    'change' => $stockData['change'],
                    'change_percent' => $stockData['change_percent'],
                    'day_high' => $stockData['day_high'],
                    'day_low' => $stockData['day_low'],
                    'fifty_two_week_high' => $stockData['fifty_two_week_high'],
                    'fifty_two_week_low' => $stockData['fifty_two_week_low'],
                    'source' => $stockData['source'],
                    'is_live' => $stockData['is_live'] ?? false
                ],
                'history' => $stockData['history'],
                'technical' => $analysisResult
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Analysis failed: ' . $e->getMessage()]);
        }
        break;

    case 'save':
        $user = AuthHelper::requireAuth();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $symbol = strtoupper(trim($input['symbol'] ?? ''));
        $stockName = trim($input['stock_name'] ?? $symbol);
        $currentPrice = (float)($input['current_price'] ?? 0);
        $targetPrice = isset($input['target_price']) ? (float)$input['target_price'] : null;
        $timeframe = trim($input['timeframe'] ?? '1M');
        $indicators = is_array($input['indicators'] ?? null) ? json_encode($input['indicators']) : ($input['indicators_json'] ?? '{}');
        $verdict = trim($input['verdict'] ?? 'BUY');
        $confidence = (int)($input['confidence'] ?? 75);
        $notes = trim($input['notes'] ?? '');
        $requestHome = !empty($input['request_home']) ? 1 : 0;

        if (empty($symbol) || $currentPrice <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid symbol and price are required.']);
            exit;
        }

        // If user is admin, they can auto-approve to home; regular users request it and default to is_visible_on_home = 1 or 0
        $isVisibleOnHome = ($user['role'] === 'admin') ? 1 : ($requestHome ? 1 : 0);

        $stmt = $pdo->prepare("
            INSERT INTO analyses (
                user_id, symbol, stock_name, current_price, target_price, timeframe,
                indicators_json, verdict, confidence, notes, is_featured, is_visible_on_home
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        ");
        $stmt->execute([
            $user['id'], $symbol, $stockName, $currentPrice, $targetPrice, $timeframe,
            $indicators, $verdict, $confidence, $notes, $isVisibleOnHome
        ]);

        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Analysis saved to your portfolio history.',
            'id' => $newId
        ]);
        break;

    case 'history':
        $user = AuthHelper::requireAuth();
        $stmt = $pdo->prepare("
            SELECT id, symbol, stock_name, current_price, target_price, timeframe,
                   indicators_json, verdict, confidence, notes, is_visible_on_home, is_featured, created_at
            FROM analyses
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['indicators'] = json_decode($r['indicators_json'], true);
            unset($r['indicators_json']);
        }

        echo json_encode(['success' => true, 'history' => $rows]);
        break;

    case 'home_featured':
        // Public feed of analyses allowed by admin on home page
        $stmt = $pdo->query("
            SELECT a.id, a.symbol, a.stock_name, a.current_price, a.target_price, a.timeframe,
                   a.indicators_json, a.verdict, a.confidence, a.notes, a.is_featured, a.created_at,
                   u.name as author_name, u.role as author_role
            FROM analyses a
            JOIN users u ON a.user_id = u.id
            WHERE a.is_visible_on_home = 1
            ORDER BY a.is_featured DESC, a.created_at DESC
            LIMIT 12
        ");
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['indicators'] = json_decode($r['indicators_json'], true);
            unset($r['indicators_json']);
        }

        echo json_encode(['success' => true, 'analyses' => $rows]);
        break;

    case 'admin_list':
        AuthHelper::requireAdmin();
        $stmt = $pdo->query("
            SELECT a.id, a.user_id, a.symbol, a.stock_name, a.current_price, a.target_price,
                   a.timeframe, a.indicators_json, a.verdict, a.confidence, a.notes,
                   a.is_featured, a.is_visible_on_home, a.created_at,
                   u.name as user_name, u.email as user_email
            FROM analyses a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        ");
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['indicators'] = json_decode($r['indicators_json'], true);
            unset($r['indicators_json']);
        }

        echo json_encode(['success' => true, 'analyses' => $rows]);
        break;

    case 'toggle_home_visibility':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid analysis ID required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT is_visible_on_home, is_featured FROM analyses WHERE id = ?");
        $stmt->execute([$id]);
        $analysis = $stmt->fetch();

        if (!$analysis) {
            http_response_code(404);
            echo json_encode(['error' => 'Analysis not found.']);
            exit;
        }

        $newStatus = $analysis['is_visible_on_home'] ? 0 : 1;
        $update = $pdo->prepare("UPDATE analyses SET is_visible_on_home = ? WHERE id = ?");
        $update->execute([$newStatus, $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Home page visibility updated.',
            'id' => $id,
            'is_visible_on_home' => $newStatus
        ]);
        break;

    case 'toggle_featured':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT is_featured FROM analyses WHERE id = ?");
        $stmt->execute([$id]);
        $analysis = $stmt->fetch();

        if (!$analysis) {
            http_response_code(404);
            echo json_encode(['error' => 'Analysis not found.']);
            exit;
        }

        $newStatus = $analysis['is_featured'] ? 0 : 1;
        $update = $pdo->prepare("UPDATE analyses SET is_featured = ? WHERE id = ?");
        $update->execute([$newStatus, $id]);

        echo json_encode([
            'success' => true,
            'id' => $id,
            'is_featured' => $newStatus
        ]);
        break;

    case 'delete':
        $user = AuthHelper::requireAuth();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid ID required.']);
            exit;
        }

        if ($user['role'] === 'admin') {
            $del = $pdo->prepare("DELETE FROM analyses WHERE id = ?");
            $del->execute([$id]);
        } else {
            $del = $pdo->prepare("DELETE FROM analyses WHERE id = ? AND user_id = ?");
            $del->execute([$id, $user['id']]);
        }

        echo json_encode(['success' => true, 'message' => 'Analysis deleted.']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid analysis action.']);
        break;
}
