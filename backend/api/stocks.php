<?php
// backend/api/stocks.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'allowed';
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'allowed':
        $search = trim($_GET['search'] ?? '');
        if (!empty($search)) {
            $stmt = $pdo->prepare("SELECT * FROM stocks WHERE is_allowed = 1 AND (symbol LIKE ? OR name LIKE ? OR sector LIKE ?) ORDER BY symbol ASC");
            $like = "%$search%";
            $stmt->execute([$like, $like, $like]);
        } else {
            $stmt = $pdo->query("SELECT * FROM stocks WHERE is_allowed = 1 ORDER BY symbol ASC");
        }
        $stocks = $stmt->fetchAll();
        echo json_encode(['success' => true, 'stocks' => $stocks]);
        break;

    case 'admin_list':
        AuthHelper::requireAdmin();
        $search = trim($_GET['search'] ?? '');
        if (!empty($search)) {
            $stmt = $pdo->prepare("SELECT * FROM stocks WHERE symbol LIKE ? OR name LIKE ? OR sector LIKE ? ORDER BY created_at DESC");
            $like = "%$search%";
            $stmt->execute([$like, $like, $like]);
        } else {
            $stmt = $pdo->query("SELECT * FROM stocks ORDER BY created_at DESC");
        }
        $stocks = $stmt->fetchAll();
        echo json_encode(['success' => true, 'stocks' => $stocks]);
        break;

    case 'toggle_allowed':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid stock ID is required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT is_allowed FROM stocks WHERE id = ?");
        $stmt->execute([$id]);
        $stock = $stmt->fetch();

        if (!$stock) {
            http_response_code(404);
            echo json_encode(['error' => 'Stock not found.']);
            exit;
        }

        $newStatus = $stock['is_allowed'] ? 0 : 1;
        $update = $pdo->prepare("UPDATE stocks SET is_allowed = ? WHERE id = ?");
        $update->execute([$newStatus, $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Stock status updated successfully.',
            'id' => $id,
            'is_allowed' => $newStatus
        ]);
        break;

    case 'add':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $symbol = strtoupper(trim($input['symbol'] ?? ''));
        $name = trim($input['name'] ?? '');
        $exchange = trim($input['exchange'] ?? 'NASDAQ');
        $sector = trim($input['sector'] ?? 'General');
        $isAllowed = isset($input['is_allowed']) ? (int)$input['is_allowed'] : 1;

        if (empty($symbol) || empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'Symbol and Name are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM stocks WHERE symbol = ?");
        $stmt->execute([$symbol]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => "Stock '$symbol' already exists."]);
            exit;
        }

        $insert = $pdo->prepare("INSERT INTO stocks (symbol, name, exchange, sector, is_allowed) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$symbol, $name, $exchange, $sector, $isAllowed]);

        echo json_encode([
            'success' => true,
            'message' => "Stock $symbol added successfully.",
            'stock' => [
                'id' => (int)$pdo->lastInsertId(),
                'symbol' => $symbol,
                'name' => $name,
                'exchange' => $exchange,
                'sector' => $sector,
                'is_allowed' => $isAllowed
            ]
        ]);
        break;

    case 'delete':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid stock ID is required.']);
            exit;
        }

        $del = $pdo->prepare("DELETE FROM stocks WHERE id = ?");
        $del->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Stock deleted successfully.']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid stocks action.']);
        break;
}
