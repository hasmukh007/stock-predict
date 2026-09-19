<?php
// backend/api/reminders.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../services/YahooFinanceService.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = Database::getConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$user = AuthHelper::requireAuth();

switch ($action) {
    case 'list':
        $stmt = $pdo->prepare("SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user['id']]);
        $reminders = $stmt->fetchAll();
        echo json_encode(['success' => true, 'reminders' => $reminders]);
        break;

    case 'create':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $symbol = strtoupper(trim($input['symbol'] ?? ''));
        $targetPrice = (float)($input['target_price'] ?? 0);
        $condition = trim($input['condition'] ?? 'above');
        $note = trim($input['note'] ?? '');

        if (empty($symbol) || $targetPrice <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid symbol and target price are required.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO reminders (user_id, symbol, target_price, condition, is_active, note) VALUES (?, ?, ?, ?, 1, ?)");
        $stmt->execute([$user['id'], $symbol, $targetPrice, $condition, $note]);

        echo json_encode([
            'success' => true,
            'message' => "Reminder set for $symbol when price goes $condition \$$targetPrice.",
            'id' => (int)$pdo->lastInsertId()
        ]);
        break;

    case 'check':
        // Evaluates active reminders against live prices
        $stmt = $pdo->prepare("SELECT * FROM reminders WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$user['id']]);
        $activeReminders = $stmt->fetchAll();

        $triggered = [];
        $checked = [];

        foreach ($activeReminders as $rem) {
            try {
                $stockData = YahooFinanceService::getStockData($rem['symbol'], '1d');
                $currPrice = $stockData['current_price'] ?? 0;
                $rem['current_price'] = $currPrice;

                $isTriggered = false;
                if ($rem['condition'] === 'above' && $currPrice >= $rem['target_price']) {
                    $isTriggered = true;
                } elseif ($rem['condition'] === 'below' && $currPrice <= $rem['target_price']) {
                    $isTriggered = true;
                }

                if ($isTriggered && !$rem['is_triggered']) {
                    $now = date('Y-m-d H:i:s');
                    $up = $pdo->prepare("UPDATE reminders SET is_triggered = 1, triggered_at = ? WHERE id = ?");
                    $up->execute([$now, $rem['id']]);
                    $rem['is_triggered'] = 1;
                    $rem['triggered_at'] = $now;
                    $triggered[] = $rem;
                }

                $checked[] = $rem;
            } catch (Exception $e) {
                // Continue with next
            }
        }

        echo json_encode([
            'success' => true,
            'total_checked' => count($checked),
            'newly_triggered' => $triggered,
            'all_reminders' => $checked
        ]);
        break;

    case 'delete':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $del = $pdo->prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?");
        $del->execute([$id, $user['id']]);

        echo json_encode(['success' => true, 'message' => 'Reminder removed.']);
        break;

    case 'toggle_active':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT is_active FROM reminders WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Reminder not found.']);
            exit;
        }

        $newVal = $row['is_active'] ? 0 : 1;
        $up = $pdo->prepare("UPDATE reminders SET is_active = ? WHERE id = ? AND user_id = ?");
        $up->execute([$newVal, $id, $user['id']]);

        echo json_encode(['success' => true, 'id' => $id, 'is_active' => $newVal]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid reminder action.']);
        break;
}
